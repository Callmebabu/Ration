from django.contrib import admin
from .models import RationItem, Stock, Family, FamilyMember, Order, OrderItem,Payment

class FamilyAdmin(admin.ModelAdmin):
    list_display = ('family_id', 'area')
    search_fields = ('family_id', 'area')
    list_filter = ('area',)

from django.utils.html import format_html

class FamilyMemberAdmin(admin.ModelAdmin):
    list_display = ('name', 'aadhar_number', 'family', 'profile_thumbnail')
    search_fields = ('name', 'aadhar_number')
    list_filter = ('family',)

    def profile_thumbnail(self, obj):
        if obj.profile_image:
            return format_html('<img src="{}" width="50" height="50" style="object-fit: cover; border-radius: 50%;" />', obj.profile_image.url)
        return "No Image"
    profile_thumbnail.short_description = 'Profile Image'

@admin.register(RationItem)
class RationItemAdmin(admin.ModelAdmin):
    list_display = [
        'name', 
        'limit_1_member', 
        'limit_2_members', 
        'limit_3_members', 
        'limit_4_members',
        'price',
        'area'
    ]
    search_fields = ('name', 'area')
    list_filter = ('area',)

class StockAdmin(admin.ModelAdmin):
    list_display = ('item', 'quantity_in_stock')
    search_fields = ('item__name',)
    list_filter = ('item__area',)

admin.site.register(Family, FamilyAdmin)
admin.site.register(FamilyMember, FamilyMemberAdmin)
admin.site.register(Stock, StockAdmin)


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0  # No extra empty rows

class OrderAdmin(admin.ModelAdmin):
    list_display = ('token_number', 'family', 'total_price', 'payment_status', 'created_at')
    search_fields = ('token_number', 'family__family_id')
    list_filter = ('payment_status', 'created_at')
    inlines = [OrderItemInline]

class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'item', 'quantity')
    search_fields = ('order__token_number', 'item__name')
    list_filter = ('item__area',)

class PaymentAdmin(admin.ModelAdmin):
    list_display = ('order', 'amount', 'is_paid', 'payment_date')
    search_fields = ('order__token_number',)
    list_filter = ('is_paid',)

# Register the models
admin.site.register(Order, OrderAdmin)
admin.site.register(OrderItem, OrderItemAdmin)
admin.site.register(Payment, PaymentAdmin)
from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'area', 'message_summary', 'timestamp')
    list_filter = ('area', 'timestamp')
    search_fields = ('message', 'area')
    ordering = ('-timestamp',)

    def message_summary(self, obj):
        return obj.message[:50] + ('...' if len(obj.message) > 50 else '')
    message_summary.short_description = 'Message'

# If you want, you can also register FamilyMember or other related models here
