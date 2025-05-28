from rest_framework import serializers
from .models import Stock

class StockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stock
        fields = ['id', 'item_name', 'quantity', 'total_quantity', 'price', 'image', 'area']


# serializers.py
from rest_framework import serializers
from .models import FamilyMember

class FamilyMemberSerializer(serializers.ModelSerializer):
    profile_image = serializers.ImageField(use_url=True, required=False)

    class Meta:
        model = FamilyMember
        fields = ['name', 'aadhar_number', 'email', 'profile_image']


    def get_profile_image(self, obj):
        request = self.context.get('request')
        if obj.profile_image and hasattr(obj.profile_image, 'url'):
            return request.build_absolute_uri(obj.profile_image.url)
        return None
    def validate_aadhar_number(self, value):
        # Check if new aadhar_number already exists when updating
        if FamilyMember.objects.filter(aadhar_number=value).exists():
            # If this is an update, exclude current instance from check
            if self.instance and self.instance.aadhar_number != value:
                raise serializers.ValidationError("Aadhar number already exists.")
        return value



from rest_framework import serializers
from .models import RationItem

class RationItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = RationItem
        fields = ['name', 'limit_1_member', 'limit_2_members', 'limit_3_members', 'limit_4_members', 'price', 'area']
        
from rest_framework import serializers
from .models import Order, OrderItem, RationItem

from rest_framework import serializers

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['item', 'quantity']

class OrderSerializer(serializers.ModelSerializer):
    order_items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = ['family', 'token_number', 'total_price', 'otp', 'payment_status', 'created_at', 'order_items']

from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'message', 'area', 'timestamp']
