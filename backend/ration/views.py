import random
import string
import logging
import json
from datetime import timedelta
from io import BytesIO

from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.hashers import check_password, make_password
from django.db import transaction
from django.shortcuts import get_object_or_404, render
from django.http import JsonResponse, HttpResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.crypto import get_random_string

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

from .models import (
    Family,
    FamilyMember,
    RationItem,
    Order,
    OrderItem,
    OTP,
)
from .serializers import (
    FamilyMemberSerializer,
    RationItemSerializer,
)


User = get_user_model()
logger = logging.getLogger(__name__)

# Helper function to generate OTP
def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

# 1. Login with Aadhar
@api_view(['POST'])
def login_with_aadhar(request):
    aadhar_number = request.data.get('aadhar_number')

    if not aadhar_number:
        return Response({"error": "No Aadhar number provided"}, status=400)

    member = FamilyMember.objects.filter(aadhar_number=aadhar_number.strip()).first()
    if member:
        return Response({
            "message": "Login successful",
            "name": member.name,
            "family_id": member.family.family_id,
            "area": member.family.area
        })
    else:
        return Response({"error": "Aadhar not registered"}, status=400)

# 2. Send OTP to Email (with logging and config-based email sender)
@api_view(['POST'])
def send_otp(request):
    aadhar_number = request.data.get('aadhar_number')
    email = request.data.get('email')

    if not aadhar_number or not email:
        return Response({'success': False, 'error': 'Aadhar number and email are required.'}, status=400)

    try:
        family_member = FamilyMember.objects.get(aadhar_number=aadhar_number, email=email)
    except FamilyMember.DoesNotExist:
        return Response({'success': False, 'error': 'Aadhar number and email do not match.'}, status=404)

    otp = generate_otp()
    family_member.otp = otp
    family_member.save()

    try:
        send_mail(
            'Your OTP for Login',
            f'Your OTP is: {otp}',
            settings.EMAIL_HOST_USER,
            [email],
            fail_silently=False,
        )
        return Response({'success': True, 'message': 'OTP sent to registered email.'})
    except Exception as e:
        logger.error(f"Error sending OTP to {email}: {str(e)}")
        return Response({'success': False, 'error': f'Failed to send email: {str(e)}'}, status=500)

# 3. Verify OTP
@api_view(['POST'])
def verify_otp(request):
    aadhar_number = request.data.get('aadhar_number')
    otp = request.data.get('otp')

    try:
        member = FamilyMember.objects.get(aadhar_number=aadhar_number)
    except FamilyMember.DoesNotExist:
        return Response({'success': False, 'error': 'Invalid Aadhar number.'}, status=404)

    if member.otp == otp:
        member.otp = ''
        member.save()
        return Response({'success': True, 'message': 'OTP verified successfully.'})
    else:
        return Response({'success': False, 'error': 'Invalid OTP.'}, status=400)



# 5. Place Order
from django.db import transaction

@api_view(['POST'])
def place_order(request):
    data = request.data
    family_id = data.get('family_id')
    items = data.get('items', [])

    if not family_id or not items:
        return Response({"success": False, "error": "Missing family_id or items"}, status=400)

    try:
        family = Family.objects.get(id=family_id)
    except Family.DoesNotExist:
        return Response({"success": False, "error": "Invalid family_id"}, status=400)

    with transaction.atomic():
        order = Order.objects.create(family=family)

        for item in items:
            item_id = item.get('item_id')
            quantity = item.get('quantity', 0)

            if not item_id or quantity <= 0:
                continue

            try:
                ration_item = RationItem.objects.select_for_update().get(id=item_id)
            except RationItem.DoesNotExist:
                continue

            if ration_item.total_quantity < quantity:
                transaction.set_rollback(True)
                return Response({"success": False, "error": f"Not enough stock for {ration_item.name}"}, status=400)

            OrderItem.objects.create(order=order, ration_item=ration_item, quantity=quantity)
            ration_item.total_quantity -= quantity
            ration_item.save()

    return Response({"success": True, "order_id": order.id})




# 6. Add Item
@api_view(['POST'])
def add_item(request):
    if request.method == 'POST':
        # Validate if 'image' is in the request (as file data)
        if 'image' not in request.FILES:
            return Response({"error": "Image file is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Ensure all required data is provided (name, quantity, price, etc.)
        name = request.data.get('name')
        total_quantity = request.data.get('total_quantity')
        price = request.data.get('price')
        area = request.data.get('area')
        
        if not name or not total_quantity or not price or not area:
            return Response({"error": "Missing required fields."}, status=status.HTTP_400_BAD_REQUEST)

        # Handle limit fields and ensure they are integers
        limit_1 = int(request.data.get('limit_1', 0))  # Default to 0 if not provided
        limit_2 = int(request.data.get('limit_2', 0))  # Default to 0 if not provided
        limit_3 = int(request.data.get('limit_3', 0))  # Default to 0 if not provided
        limit_4 = int(request.data.get('limit_4', 0))  # Default to 0 if not provided
        
        # Handle image file and create a new RationItem object
        image = request.FILES.get('image')

        ration_item = RationItem.objects.create(
            name=name,
            total_quantity=total_quantity,
            price=price,
            area=area,
            image=image,
            limit_1_member=limit_1,
            limit_2_members=limit_2,
            limit_3_members=limit_3,
            limit_4_members=limit_4
        )

        # ✅ Create Notification for this area
        from .models import Notification
        Notification.objects.create(
            message=f"🛒 New stock for {name} is available in your area!",
            area=area
        )

        # Return response
        return Response({
            "message": "Ration item created successfully and notification sent.",
            "item_id": ration_item.id,
        }, status=status.HTTP_201_CREATED)


 
# 7. Admin Stock View
@api_view(['GET'])
def admin_stock_view(request):
    # Assuming you are using a similar setup for your stock view
    items = RationItem.objects.filter(total_quantity__gt=0)  # Fetch items that have stock available
    
    stock = [
        {
            "id": item.id,
            "item_name": item.name,
            "total_quantity": item.total_quantity,  # Use total_quantity instead of quantity
            "price": item.price,
            "area": item.area,
            "image": request.build_absolute_uri(item.image.url) if item.image else None,
        }
        for item in items
    ]
    
    return Response({"stock": stock})


# 8. Admin Login
@api_view(['POST'])
def admin_login(request):
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)
    if user and user.is_staff:
        return Response({"success": True, "message": "Login successful"})
    return Response({"success": False, "message": "Invalid credentials"}, status=401)

# 9. Change Admin Password
@api_view(['POST'])
def change_admin_password(request):
    username = request.data.get("username")
    new_password = request.data.get("password")

    if not username or not new_password:
        return Response({"error": "Username and password are required"}, status=400)

    try:
        user = User.objects.get(username=username)
        user.set_password(new_password)
        user.save()
        return Response({"message": "Password updated successfully"})
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

# 10. Add Family
@api_view(['POST'])
def add_family(request):
    family_id = request.data.get('family_id')
    area = request.data.get('area')

    if not family_id or not area:
        return Response({'message': 'Family ID and Area are required.'}, status=400)

    Family.objects.create(family_id=family_id, area=area)
    return Response({'message': 'Family added successfully.'})

# 11. Add Member to Family
@api_view(['POST'])
def add_member(request):
    family_id = request.data.get('family_id')
    name = request.data.get('name')
    aadhar_number = request.data.get('aadhar_number')
    email = request.data.get('email')

    if not all([family_id, name, aadhar_number, email]):
        return Response({'message': 'All fields are required.'}, status=400)

    try:
        family = Family.objects.get(family_id=family_id)
    except Family.DoesNotExist:
        return Response({'message': 'Family ID not found.'}, status=404)

    if FamilyMember.objects.filter(aadhar_number=aadhar_number).exists():
        return Response({'message': 'Aadhar number already registered.'}, status=400)

    FamilyMember.objects.create(
        family=family,
        name=name,
        aadhar_number=aadhar_number,
        email=email
    )

    return Response({'message': 'Member added successfully.'})


# 12. Get Family Members
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def get_family_members(request):
    family_id = request.query_params.get('family_id')
    if not family_id:
        return Response({'message': 'Family ID is required.'}, status=400)

    try:
        family = Family.objects.get(family_id=family_id)
        members = FamilyMember.objects.filter(family=family)
        
        data = []
        for member in members:
            profile_image_url = None
            if member.profile_image:
                # Build absolute URL for the image
                profile_image_url = request.build_absolute_uri(member.profile_image.url)
            
            data.append({
                'name': member.name,
                'aadhar_number': member.aadhar_number,
                'email': member.email or 'N/A',
                'profile_image': profile_image_url,
            })

        return Response(data)

    except Family.DoesNotExist:
        return Response({'message': 'Family not found.'}, status=404)


# 13. Validate Aadhar and Email
@api_view(['POST'])
def validate_aadhar_email(request):
    aadhar_number = request.data.get('aadhar_number')
    email = request.data.get('email')

    if not aadhar_number or not email:
        return Response({'success': False, 'error': 'Aadhar number and email are required.'}, status=400)

    # Logic to validate Aadhar and Email, e.g., querying the database:
    try:
        member = FamilyMember.objects.get(aadhar_number=aadhar_number, email=email)
        return Response({
            'success': True,
            'message': 'Aadhar and email validated successfully.',
            'member_name': member.name,
            'family_id': member.family.family_id,
        })
    except FamilyMember.DoesNotExist:
        return Response({'success': False, 'error': 'No member found with this Aadhar and email.'}, status=404)


    
# 14. Verify OTP

@api_view(['POST'])
def verify_otp(request):
    aadhar_number = request.data.get('aadhar_number')
    otp_input = request.data.get('otp')

    if not aadhar_number or not otp_input:
        return Response({'error': 'Aadhar number and OTP are required.'}, status=400)

    try:
        # Retrieve member by aadhar_number
        member = FamilyMember.objects.get(aadhar_number=aadhar_number)
    except FamilyMember.DoesNotExist:
        return Response({'error': 'Invalid Aadhar number.'}, status=404)

    # Ensure otp_expiry_time is timezone-aware
    if member.otp_expiry_time and timezone.is_naive(member.otp_expiry_time):
        member.otp_expiry_time = timezone.make_aware(member.otp_expiry_time)

    # Check OTP expiration (ensure we only check expiration if otp_expiry_time is set)
    if member.otp_expiry_time and member.otp_expiry_time < timezone.now():
        return Response({'error': 'OTP has expired.'}, status=400)

    # Compare OTP input with the stored hashed OTP
    if member.otp and check_password(otp_input, member.otp):
        # Clear OTP after verification
        member.otp = ''  
        member.otp_expiry_time = None  # Clear expiry time after OTP verification
        member.save()

        return Response({
            'message': 'OTP verified successfully.',
            'name': member.name,
            'family_id': member.family.family_id,
            'area': member.family.area,
            'email': member.email,
        })
    else:
        return Response({'error': 'Invalid OTP.'}, status=400)



def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

@api_view(['POST'])
def send_otp(request):
    aadhar_number = request.data.get('aadhar_number')
    email = request.data.get('email')

    if not aadhar_number or not email:
        return Response({'error': 'Aadhar number and email are required.'}, status=400)

    try:
        family_member = FamilyMember.objects.get(aadhar_number=aadhar_number, email=email)
    except FamilyMember.DoesNotExist:
        return Response({'error': 'Family member not found.'}, status=404)

    otp_plain = generate_otp()
    hashed_otp = make_password(otp_plain)
    expiry_time = timezone.now() + timedelta(minutes=5)

    family_member.otp = hashed_otp
    family_member.otp_expiry_time = expiry_time
    family_member.save()

    try:
        send_mail(
            'Your OTP for Login',
            f'Your OTP is: {otp_plain}',
            settings.EMAIL_HOST_USER,
            [email],
            fail_silently=False,
        )
        return Response({'success': True, 'message': 'OTP sent to registered email.'})
    except Exception as e:
        logger.error(f"Failed to send OTP: {e}")
        return Response({'error': f'Email sending failed: {e}'}, status=500)


from .serializers import FamilyMemberSerializer

# 15. Get Stock Data
class GetStockData(APIView):
    def get(self, request):
        family_id = request.query_params.get('family_id')

        try:
            family = Family.objects.get(family_id=family_id)
        except Family.DoesNotExist:
            return Response({'error': 'Family not found'}, status=404)

        # Get family size (number of members)
        family_size = family.members.count()
        family_size = min(family_size, 4)  # Cap at 4

        # Get all ration items for the family's area
        ration_items = RationItem.objects.filter(area=family.area)

        data = []
        for item in ration_items:
            item_data = RationItemSerializer(item).data
            # Determine correct limit field
            limit_field = f"limit_{family_size}_member" if family_size == 1 else f"limit_{family_size}_members"
            item_data['limit'] = getattr(item, limit_field, 0)
            data.append(item_data)

        return Response({
            'stock': data,
            'family_size': family_size
        })
    

# 16. Admin View Orders by OTP and Area
@api_view(['GET'])
def admin_view_orders_by_otp_and_area(request):
    otp = request.GET.get('otp')
    area = request.GET.get('area')

    if not otp or not area:
        return Response({'error': 'OTP and area are required'}, status=400)

    orders = Order.objects.filter(otp=otp, family__area=area, is_paid=True)

    if not orders.exists():
        return Response({'message': 'No orders found for this OTP and area'}, status=404)

    data = []
    for order in orders:
        items = OrderItem.objects.filter(order=order)
        item_list = [{
            'name': item.item.name,
            'quantity': item.quantity,
            'price': item.item.price,
            'total_price': item.quantity * item.item.price
        } for item in items]

        data.append({
            'order_id': order.id,
            'family_id': order.family.family_id,
            'token_number': order.token_number,
            'total_price': order.total_price,
            'otp': order.otp,
            'items': item_list,
        })

    return Response({'orders': data}, status=200)



import random
from django.core.mail import send_mail
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import OTP

@api_view(['POST'])
def send_otp_email(request):
    email = request.data.get('email')

    if not email:
        return Response({'success': False, 'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

    otp_code = f"{random.randint(100000, 999999)}"
    OTP.objects.create(email=email, code=otp_code)

    try:
        send_mail(
            subject='Your OTP Code',
            message=f'Your OTP is {otp_code}. It expires in 5 minutes.',
            from_email='noreply@yourdomain.com',
            recipient_list=[email],
        )
        return Response({'success': True, 'message': 'OTP sent to email.'})
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 19. Generate PDF Bill
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from io import BytesIO
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from .models import FamilyMember, Order, OrderItem
from django.conf import settings
from django.utils import translation
import os
import time

def download_invoice(request, email):
    lang = request.GET.get('lang', 'en')
    translation.activate(lang)

    # Register Tamil font if Tamil language selected
    if lang == 'ta':
        tamil_font_path = os.path.join(settings.BASE_DIR, 'static', 'fonts', 'NotoSansTamil-Regular.ttf')
        pdfmetrics.registerFont(TTFont('Tamil', tamil_font_path))
        selected_font = 'Tamil'

        # Tamil static labels
        shop_name = "என் அன்னாச்சியின் கடை"
        invoice_title = "பில்"
        family_id_label = "குடும்ப ஐடி"
        order_token_label = "ஆர்டர் குறியீடு"
        order_date_label = "ஆர்டர் தேதி"
        item_label = "பொருள்"
        quantity_label = "அளவு"
        price_label = "விலை (₹)"
        total_label = "மொத்தம் (₹)"
        total_price_label = "மொத்த விலை:"
        thank_you_msg = "உங்கள் வாங்குதலுக்கு நன்றி!"

        # Tamil translation map for item names
        tamil_name_map = {
            "Rice": "அரிசி",
            "Wheat": "கோதுமை",
            "Sugar": "சர்க்கரை",
            "Oil": "எண்ணெய்",
            # Add more item translations here
        }
    else:
        selected_font = 'Helvetica-Bold'

        # English static labels
        shop_name = "My Ration Shop"
        invoice_title = "INVOICE"
        family_id_label = "Family ID"
        order_token_label = "Order Token"
        order_date_label = "Order Date"
        item_label = "Item"
        quantity_label = "Quantity"
        price_label = "Price (₹)"
        total_label = "Total (₹)"
        total_price_label = "Total Price:"
        thank_you_msg = "Thank you for your purchase!"

        tamil_name_map = {}

    family_member = get_object_or_404(FamilyMember, email=email)
    family = family_member.family
    order = Order.objects.filter(family=family).order_by('-created_at').first()

    if not order:
        return HttpResponse("No order found.", status=404)

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            rightMargin=30, leftMargin=30,
                            topMargin=30, bottomMargin=18)
    elements = []
    styles = getSampleStyleSheet()

    style_title = ParagraphStyle(name='Title', parent=styles['Title'],
                                 fontName=selected_font, alignment=1, fontSize=18)

    style_heading = ParagraphStyle(name='Heading2', parent=styles['Heading2'],
                                   fontName=selected_font, fontSize=14)

    style_normal = ParagraphStyle(name='NormalCustom', parent=styles['Normal'],
                                  fontName=selected_font, fontSize=11)

    style_bold_center = ParagraphStyle(name='BoldCenter', parent=styles['Normal'],
                                       fontName=selected_font, alignment=1, fontSize=14)

    style_footer = ParagraphStyle(name='Footer', parent=styles['Normal'],
                                  fontName=selected_font, alignment=1, fontSize=10, textColor=colors.grey)

    # Add logo if exists
    logo_path = os.path.join(settings.BASE_DIR, 'static', 'images', 'logo.png')
    if os.path.exists(logo_path):
        logo = Image(logo_path, width=30*mm, height=30*mm)
        elements.append(logo)

    elements.append(Paragraph(shop_name, style_bold_center))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(invoice_title, style_title))
    elements.append(Spacer(1, 12))

    elements.append(Paragraph(f"{family_id_label}: {family.family_id}", style_normal))
    elements.append(Paragraph(f"{order_token_label}: {order.token_number}", style_normal))
    elements.append(Paragraph(f"{order_date_label}: {order.created_at.strftime('%Y-%m-%d %H:%M:%S')}", style_normal))
    elements.append(Spacer(1, 12))

    # Table header
    data = [[item_label, quantity_label, price_label, total_label]]

    total_price = 0
    order_items = OrderItem.objects.filter(order=order)

    for item in order_items:
        if lang == 'ta':
            name = tamil_name_map.get(item.item.name, item.item.name)  # Translate or fallback
        else:
            name = item.item.name
        qty = item.quantity
        price = float(item.item.price)
        line_total = qty * price
        total_price += line_total
        data.append([name, str(qty), f"{price:.2f}", f"{line_total:.2f}"])

    data.append(['', '', '', ''])
    data.append(["", "", total_price_label, f"₹{total_price:.2f}"])

    table = Table(data, colWidths=[200, 60, 80, 80], hAlign='LEFT')
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#003366')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, -1), selected_font),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -3), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTNAME', (2, -1), (-1, -1), selected_font),
        ('BACKGROUND', (2, -1), (-1, -1), colors.HexColor('#e0e0e0')),
        ('ALIGN', (2, -1), (-1, -1), 'RIGHT'),
    ]))

    elements.append(table)
    elements.append(Spacer(1, 24))
    elements.append(Paragraph(thank_you_msg, style_footer))

    doc.build(elements)

    buffer.seek(0)

    timestamp = int(time.time())
    filename = f"invoice_{timestamp}.pdf"

    return HttpResponse(buffer, content_type='application/pdf', headers={
        'Content-Disposition': f'attachment; filename="{filename}"',
    })




# 20. Get Recent Items by Area
def get_recent_items_by_area(request, area_name):
    recent_time = timezone.now() - timedelta(days=2)  # last 2 days
    items = RationItem.objects.filter(area=area_name, created_at__gte=recent_time)
    data = [
        {
            'name': item.name,
            'price': str(item.price),
            'image': item.image.url if item.image else '',
            'created_at': item.created_at,
        }
        for item in items
    ]
    return JsonResponse({'items': data})


# 21. Family Member List View
class FamilyMemberListView(APIView):
    def get(self, request):
        family_id = request.query_params.get('family_id')
        if not family_id:
            return Response({"error": "Family ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            family = Family.objects.get(family_id=family_id)
        except Family.DoesNotExist:
            return Response({"error": "Family not found"}, status=status.HTTP_404_NOT_FOUND)

        members = FamilyMember.objects.filter(family=family)
        serializer = FamilyMemberSerializer(members, many=True, context={'request': request})
        return Response(serializer.data)


# 22. Update Family

@api_view(['PUT'])
def update_family(request, family_id):
    try:
        family = Family.objects.get(family_id=family_id)
    except Family.DoesNotExist:
        return Response({'error': 'Family not found'}, status=status.HTTP_404_NOT_FOUND)

    data = request.data
    new_family_id = data.get('family_id')
    area = data.get('area')

    if not new_family_id or not area:
        return Response({'error': 'Both family_id and area are required'}, status=status.HTTP_400_BAD_REQUEST)

    if new_family_id != family_id and Family.objects.filter(family_id=new_family_id).exists():
        return Response({'error': 'New family_id already exists'}, status=status.HTTP_400_BAD_REQUEST)

    family.family_id = new_family_id
    family.area = area
    family.save()

    return Response({'family_id': family.family_id, 'area': family.area})
# 23. Delete Family Member and Family
@api_view(['DELETE'])
def delete_member(request, aadhar_number):
    try:
        member = FamilyMember.objects.get(aadhar_number=aadhar_number)
        member.delete()
        return Response({'message': 'Member deleted successfully.'})
    except FamilyMember.DoesNotExist:
        return Response({'message': 'Member not found.'}, status=404)
    
# 24. Delete Family
@api_view(['DELETE'])
def delete_family(request, family_id):
    try:
        family = Family.objects.get(family_id=family_id)
        family.delete()
        return Response({'message': 'Family deleted successfully.'}, status=status.HTTP_200_OK)
    except Family.DoesNotExist:
        return Response({'error': 'Family not found.'}, status=status.HTTP_404_NOT_FOUND)

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import FamilyMember


# 25. Update Family Member
@api_view(['PUT'])
def update_member(request, aadhar_number):
    try:
        member = FamilyMember.objects.get(aadhar_number=aadhar_number)
    except FamilyMember.DoesNotExist:
        return Response({"error": "Member not found"}, status=status.HTTP_404_NOT_FOUND)

    data = request.data
    name = data.get('name')
    new_aadhar = data.get('aadhar_number')
    email = data.get('email')

    if not name or not new_aadhar or not email:
        return Response({"error": "Name, aadhar_number, and email are required."}, status=status.HTTP_400_BAD_REQUEST)

    # Check if new aadhar_number is different and already exists
    if new_aadhar != aadhar_number:
        if FamilyMember.objects.filter(aadhar_number=new_aadhar).exists():
            return Response({"error": "Aadhar number already exists."}, status=status.HTTP_400_BAD_REQUEST)

    member.name = name
    member.aadhar_number = new_aadhar
    member.email = email
    member.save()

    return Response({
        "name": member.name,
        "aadhar_number": member.aadhar_number,
        "email": member.email,
    })

# 26. Upload Profile Image
@api_view(['DELETE'])
def delete_profile(request, email):
    try:
        member = FamilyMember.objects.get(email=email)
        member.profile_image.delete(save=True)
        return Response({'message': 'Profile image deleted successfully'}, status=status.HTTP_200_OK)
    except FamilyMember.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from .models import FamilyMember

@api_view(['PUT'])
@parser_classes([MultiPartParser, FormParser])
def upload_profile_image(request, email):
    try:
        member = FamilyMember.objects.get(email=email)
    except FamilyMember.DoesNotExist:
        return Response({'error': 'Member not found'}, status=404)

    if 'profile_image' not in request.FILES:
        return Response({'error': 'No image provided'}, status=400)

    member.profile_image = request.FILES['profile_image']
    member.save()

    return Response({'message': 'Profile image updated successfully'})




from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from .models import Order, OrderItem, Family

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_view_orders(request):
    area = request.query_params.get('area', None)  # Get area from query param

    if area:
        # Filter orders where order.family.area matches the area param
        orders = Order.objects.filter(family__area=area).order_by('-created_at')
    else:
        orders = Order.objects.all().order_by('-created_at')

    data = []
    for order in orders:
        items = OrderItem.objects.filter(order=order)
        data.append({
            'order_id': order.id,
            'token_number': order.token_number,
            'family': order.family.family_id,
            'area': order.family.area,  # include area in response
            'total_price': float(order.total_price),
            'payment_status': order.payment_status,
            'created_at': order.created_at.strftime('%Y-%m-%d %H:%M'),
            'items': [
                {
                    'item_name': item.item.name,
                    'quantity': item.quantity,
                    'price_per_unit': float(item.item.price),
                    'total': float(item.quantity * item.item.price)
                }
                for item in items
            ]
        })

    return Response({'success': True, 'orders': data})

# Add a new API endpoint to get distinct areas from Family
@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_areas(request):
    areas = Family.objects.values_list('area', flat=True).distinct()
    return Response({'success': True, 'areas': list(areas)})



# 4. View Stock
from datetime import timedelta
from django.utils import timezone
from django.db.models import F
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Family, Order, OrderItem, RationItem

@api_view(['GET'])
def view_stock(request):
    family_id = request.GET.get('family_id')
    if not family_id:
        return Response({"error": "Missing family_id"}, status=400)

    try:
        family = Family.objects.get(family_id=family_id)
    except Family.DoesNotExist:
        return Response({"error": "Invalid family_id"}, status=404)

    # Cap members between 1 and 4
    num_members = family.members.count()
    capped_members = max(1, min(num_members, 4))
    limit_field = f'limit_{capped_members}_member' if capped_members == 1 else f'limit_{capped_members}_members'

    # Delete old/unusable stock items
    expiry_date = timezone.now() - timedelta(days=3)
    items_to_delete = RationItem.objects.filter(
        created_at__lt=expiry_date,
        total_quantity=0
    ) | RationItem.objects.filter(
        total_quantity__lt=F('limit_1_member')
    )
    items_to_delete.delete()

    # Get already purchased item IDs for this family
    paid_orders = Order.objects.filter(family=family, payment_status='paid')
    purchased_item_ids = OrderItem.objects.filter(order__in=paid_orders).values_list('item_id', flat=True).distinct()

    # Get available items that are in stock and not purchased yet in the family area
    items = RationItem.objects.filter(
        area=family.area,
        total_quantity__gt=0
    ).exclude(id__in=purchased_item_ids)

    stock = []
    for item in items:
        limit = getattr(item, limit_field, 0)
        if limit == 0:
            # Skip items with zero limit for this family size
            continue
        
        # Include all items regardless of quantity < limit
        stock.append({
            "id": item.id,
            "name": item.name,
            "total_quantity": item.total_quantity,
            "price": float(item.price),
            "area": item.area,
            "limit": limit,
            "image": request.build_absolute_uri(item.image.url) if item.image else None,
            "created_at": item.created_at.isoformat(),
        })

    return Response({"stock": stock})


from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import OTP, Order, OrderItem, RationItem, Family
from django.utils import timezone
from decimal import Decimal
import uuid
@api_view(['POST'])
def verify_otp_place_order(request):
    email = request.data.get('email')
    otp_code = request.data.get('otp')
    items = request.data.get('items', [])
    family_id = request.data.get('family_id')

    if not all([email, otp_code, family_id, items]):
        return Response({'success': False, 'error': 'Missing required fields.'}, status=status.HTTP_400_BAD_REQUEST)

    # Verify OTP
    try:
        otp_obj = OTP.objects.filter(email=email, code=otp_code).latest('created_at')
        if otp_obj.is_verified:
            return Response({'success': False, 'error': 'OTP already used.'})
        if otp_obj.is_expired():
            return Response({'success': False, 'error': 'OTP expired.'})
    except OTP.DoesNotExist:
        return Response({'success': False, 'error': 'Invalid OTP.'})

    otp_obj.is_verified = True
    otp_obj.save()

    try:
        family = Family.objects.get(family_id=family_id)
    except Family.DoesNotExist:
        return Response({'success': False, 'error': 'Invalid family ID.'})

    total_price = Decimal('0.00')
    order_items = []

    for item in items:
        item_id = item.get('id')
        quantity = item.get('quantity')
        if item_id is None or quantity is None:
            continue

        try:
            ration_item = RationItem.objects.get(id=item_id)
        except RationItem.DoesNotExist:
            continue

        quantity = int(quantity)

        if ration_item.total_quantity < quantity:
            return Response({'success': False, 'error': f'Not enough stock for {ration_item.name}.'})

        total_price += ration_item.price * quantity
        order_items.append((ration_item, quantity))

    if not order_items:
        return Response({'success': False, 'error': 'No valid items to order.'})

    token_number = str(uuid.uuid4())[:8]

    order = Order.objects.create(
        family=family,
        token_number=token_number,
        total_price=total_price,
        otp=otp_code,
        payment_status='paid'
    )

    for ration_item, quantity in order_items:
        OrderItem.objects.create(order=order, item=ration_item, quantity=quantity)

        # Reduce stock based on purchase quantity
        ration_item.total_quantity -= quantity
        ration_item.save()

    return Response({'success': True, 'message': 'Order placed successfully.'}, status=status.HTTP_201_CREATED)

from django.utils.timezone import now, timedelta
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Notification

@api_view(['GET'])
def get_notifications(request, area):
    notifications = Notification.objects.filter(area=area).exclude(dismissed_areas__contains=[area]).order_by('-timestamp')
    data = [{"id": n.id, "message": n.message, "timestamp": n.timestamp} for n in notifications]
    return Response(data)


@api_view(['POST'])
def dismiss_notification(request, notification_id):
    area = request.query_params.get('area')
    if not area:
        return Response({"detail": "Area parameter required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        notification = Notification.objects.get(id=notification_id)
        if area not in notification.dismissed_areas:
            notification.dismissed_areas.append(area)
            notification.save()
        return Response({"detail": "Notification dismissed for this area."})
    except Notification.DoesNotExist:
        return Response({"detail": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
def delete_all_notifications(request, area):
    notifications = Notification.objects.filter(area=area).exclude(dismissed_areas__contains=[area])
    count = notifications.count()
    for n in notifications:
        if area not in n.dismissed_areas:
            n.dismissed_areas.append(area)
            n.save()
    if count == 0:
        return Response({"detail": "No notifications to dismiss."}, status=status.HTTP_404_NOT_FOUND)
    return Response({"detail": f"Dismissed {count} notifications for this area."})


# Scheduled cleanup: delete notifications older than 3 days
def delete_old_notifications():
    cutoff = now() - timedelta(days=3)
    old_notifications = Notification.objects.filter(timestamp__lt=cutoff)
    count = old_notifications.count()
    old_notifications.delete()
    print(f"Deleted {count} notifications older than 3 days.")


@api_view(['POST'])
def mark_read_notifications(request, area):
    notifications = Notification.objects.filter(area=area, read=False)
    updated_count = notifications.update(read=True)
    return Response({"detail": f"Marked {updated_count} notifications as read."})


from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import FamilyMember
import os

@csrf_exempt
@require_http_methods(["DELETE"])
def delete_profile_image(request, email):
    try:
        member = FamilyMember.objects.get(email=email)
        
        if member.profile_image:
            # Delete the file from storage
            if os.path.isfile(member.profile_image.path):
                os.remove(member.profile_image.path)
            
            # Remove reference in database
            member.profile_image = None
            member.save()
            
            return JsonResponse({'message': 'Profile image deleted successfully.'}, status=200)
        else:
            return JsonResponse({'message': 'No profile image found to delete.'}, status=400)

    except FamilyMember.DoesNotExist:
        return JsonResponse({'message': 'Family member not found.'}, status=404)
    except Exception as e:
        return JsonResponse({'message': f'Error: {str(e)}'}, status=500)
    


    from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import RationItem, Stock, FamilyMember

@api_view(['POST'])
def chatbot_response(request):
    message = request.data.get("message", "").strip().lower()
    aadhar_number = request.data.get("aadhar_number")  # Frontend should send this

    reply = None
    user_name = None
    user_area = None

    # Get user info by Aadhar
    if aadhar_number:
        try:
            member = FamilyMember.objects.get(aadhar_number=aadhar_number)
            user_name = member.name
            user_area = member.family.area
        except FamilyMember.DoesNotExist:
            user_name = None
            user_area = None

    keywords = ["rice", "sugar", "wheat", "dal", "oil"]

    # If user asks about stock or available items, list all current stock in their area
    if any(word in message for word in ["stock", "available items", "available stock", "inventory", "what do you have"]):
        if user_area:
            stock_entries = Stock.objects.select_related('item').filter(item__area=user_area)
            if stock_entries.exists():
                reply_lines = []
                for stock in stock_entries:
                    item = stock.item
                    line = f"{item.name.title()}: ₹{item.price}/kg, {stock.quantity_in_stock} kg in stock"
                    reply_lines.append(line)
                reply = "Current stock details in your area:\n" + "\n".join(reply_lines)
            else:
                reply = "Sorry, stock information is not available in your area at the moment."
        else:
            reply = "Sorry, we couldn't identify your area from your Aadhar. Please contact support."

    # Otherwise, check if user message contains specific item keywords available in their area
    if not reply and user_area:
        for keyword in keywords:
            if keyword in message:
                items = RationItem.objects.filter(name__icontains=keyword, area=user_area)
                if items.exists():
                    # Take first matching item for simplicity
                    item = items.first()
                    stock = Stock.objects.filter(item=item).first()
                    stock_msg = f"{stock.quantity_in_stock} kg in stock" if stock else "Stock data not available"
                    reply = (
                        f"{item.name.title()} is available at ₹{item.price}/kg.\n"
                        f"Available stock: {stock_msg}."
                    )
                else:
                    reply = f"Sorry, {keyword.title()} is not available in your area."
                break

    # Rule-based responses with personalized greeting
    if not reply:
        if any(greet in message for greet in ["hi", "hello", "hey", "hai"]):
            if user_name:
                reply = f"Hello {user_name}! How can I help you today?"
            else:
                reply = "Hello! How can I help you today?"
        elif "timing" in message or "hours" in message:
            reply = "Our shop is open from 9 AM to 1 PM and 3 PM to 7 PM."
        elif "price" in message:
            reply = "You can ask for item prices like rice, sugar, wheat, etc."
        elif "order" in message:
            reply = ("To place an order, please log in and go to the 'Place Order' section. "
                     "You can select items and quantities there.")
        elif "delivery" in message or "how to get" in message:
            reply = ("Orders are processed within 24 hours. You can pick up your ration "
                     "from the shop or opt for home delivery if it's available in your area.")
        elif any(bye in message for bye in ["bye", "thank you", "thanks", "see you"]):
            reply = "You're welcome! If you have more questions, feel free to ask."

    # Default fallback
    if not reply:
        reply = "Sorry, I didn't understand that. Could you please rephrase?"

    return Response({"reply": reply})
