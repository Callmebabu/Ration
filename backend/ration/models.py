from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.utils import timezone

# Family:
class Family(models.Model):
    family_id = models.CharField(max_length=100, unique=True)
    area = models.CharField(max_length=100)
    def __str__(self):
        return self.family_id

# FamilyMember:
class FamilyMember(models.Model):
    name = models.CharField(max_length=255)
    aadhar_number = models.CharField(max_length=12, unique=True)
    email = models.EmailField(null=True, blank=True)
    otp = models.CharField(max_length=256, blank=True, null=True)
    otp_expiry_time = models.DateTimeField(null=True, blank=True)
    family = models.ForeignKey(Family, related_name='members', on_delete=models.CASCADE)  # Keep only one 'family' field
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)

    def __str__(self):
        return self.name


# RationItem:
class RationItem(models.Model):
    name = models.CharField(max_length=100) 
    total_quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    area = models.CharField(max_length=255)
    image = models.ImageField(upload_to='ration_items/', null=True, blank=True)

    # Limit fields for each family size (1-4 members)
    limit_1_member = models.IntegerField(default=0)
    limit_2_members = models.IntegerField(default=0)
    limit_3_members = models.IntegerField(default=0)
    limit_4_members = models.IntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)


    def __str__(self):
        return self.name

class Order(models.Model):
    family = models.ForeignKey(Family, on_delete=models.CASCADE)
    token_number = models.CharField(max_length=20, unique=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    otp = models.CharField(max_length=6)  # OTP for payment verification
    payment_status = models.CharField(max_length=20, default='pending')  # e.g., pending, paid, failed
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order {self.token_number}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='order_items', on_delete=models.CASCADE)
    item = models.ForeignKey(RationItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()  # quantity purchased

    def __str__(self):
        return f"{self.item.name} x {self.quantity}"

class OTP(models.Model):
    email = models.EmailField()
    code = models.CharField(max_length=6)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        expiry_duration = timezone.timedelta(minutes=5)
        return timezone.now() > self.created_at + expiry_duration

    def __str__(self):
        return f"OTP {self.code} for {self.email}"

class CustomAdminManager(BaseUserManager):
    def create_user(self, username, password, **extra_fields):
        if not username:
            raise ValueError('The Username field must be set')
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(username, password, **extra_fields)

class CustomAdminUser(AbstractBaseUser):
    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=128)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    objects = CustomAdminManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['password']

    def __str__(self):
        return self.username
    
class UserProfile(models.Model):
    user = models.OneToOneField(CustomAdminUser, on_delete=models.CASCADE)  # One-to-one relationship with CustomAdminUser
    aadhar_number = models.CharField(max_length=12, unique=True)  # Aadhar number should be unique
    email = models.EmailField(unique=True)  # Email should be unique
    otp = models.CharField(max_length=6, blank=True, null=True)  # OTP is optional for verification

    def __str__(self):
        return f"Profile of {self.user.username}"
    
# ration
class Stock(models.Model):
    item = models.ForeignKey(RationItem, on_delete=models.CASCADE)
    quantity_in_stock = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.item.name} - {self.quantity_in_stock} in stock"


class Payment(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment_order')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_paid = models.BooleanField(default=False)
    payment_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment for Order {self.order.token_number}"


from django.db import models
from django.utils import timezone

from django.contrib.postgres.fields import ArrayField  # if using Postgres

class Notification(models.Model):
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    area = models.CharField(max_length=100)  # owner area or main area
    dismissed_areas = ArrayField(models.CharField(max_length=100), default=list, blank=True)
    read = models.BooleanField(default=False)
