from django.urls import path
from . import views
from .views import FamilyMemberListView,GetStockData
from .views import update_member,delete_family, update_family,download_invoice
from .views import send_otp_email, verify_otp_place_order,admin_view_orders,upload_profile_image,get_notifications,chatbot_response

urlpatterns = [
    path('login/', views.login_with_aadhar),
    path('stock/', views.view_stock, name='view_stock'),
    path('add-item/', views.add_item, name='add_item'),
    path('admin/stock/', views.admin_stock_view, name='admin-stock'),
    path('admin-login/', views.admin_login, name='admin-login'),
    path('add-family/', views.add_family, name='add-family'),
    path('family-members/', views.get_family_members, name='family-members'),
    path('add-member/', views.add_member, name='add-member'),
    path('place_order/', views.place_order, name='place_order'),
    path('update-profile-image-by-email/<str:email>/', upload_profile_image, name='update-profile-image'),
    path('delete-profile-image/<str:email>/', views.delete_profile_image, name='delete-profile-image'),
    path('notifications/<str:area>/', views.get_notifications, name='get_notifications'),
    path('notifications/mark_read/<str:area>/', views.mark_read_notifications, name='mark_read_notifications'),
    path('notifications/delete_all/<str:area>/', views.delete_all_notifications, name='delete_all_notifications'),
    path('notifications/<int:notification_id>/dismiss/', views.dismiss_notification, name='dismiss_notification'),

path("download_invoice/<str:email>", download_invoice),
    path('admin/change-password/', views.change_admin_password, name='change-password'),
    path('validate-aadhar-email/', views.validate_aadhar_email, name='validate-aadhar-email'),
    path('send-otp/', views.send_otp, name='send-otp'),
    path('verify-otp/', views.verify_otp, name='verify-otp'),
    path('api/validate-aadhar-email/', views.validate_aadhar_email, name='validate_aadhar_email'),
    path('api/family-members', FamilyMemberListView.as_view(), name='family_member_list'),
    path('api/stock/', GetStockData.as_view(), name='get-stock-data'),
    path('api/recent-items/<str:area_name>/', views.get_recent_items_by_area),
    path('update-member/<str:aadhar_number>/', views.update_member, name='update-member'),
    path('delete-member/<str:aadhar_number>/', views.delete_member, name='delete-member'),
    path('api/update-family/<str:family_id>/', update_family, name='update-family'),
    path('api/delete-family/<str:family_id>/', views.delete_family, name='delete_family'),
    path('send_otp_email/', views.send_otp_email, name='send_otp_email'),
    path('verify_otp_place_order/', views.verify_otp_place_order, name='verify_otp_place_order'),
    path('admin/view_orders/', admin_view_orders, name='admin-view-orders'),
    path('chatbot/', chatbot_response),

]








