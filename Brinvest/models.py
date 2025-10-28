from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    wacth_list = models.ManyToManyField("Asset", related_name="watched_by", blank=True)

    pass


class Asset(models.Model):

    symbol = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    last_updated = models.DateTimeField(null=True, blank=True)
    market_cap = models.BigIntegerField(null=True, blank=True)
    pe_ratio = models.FloatField(null=True, blank=True)
    dividend_yield = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.symbol})"
    

class Stock(models.Model):

    asset = models.OneToOneField(Asset, on_delete=models.CASCADE, related_name='stock_profile')
    sector = models.CharField(max_length=100, null=True, blank=True)
    stock_type = models.CharField(max_length=100, null=True, blank=True)


    def __str__(self):
        return f"Stock: {self.asset.symbol}"

class ETF(models.Model):

    asset = models.OneToOneField(Asset, on_delete=models.CASCADE, related_name='etf_profile')
    expense_ratio = models.DecimalField(max_digits=6, decimal_places=4, null=True, blank=True)
    dividend_policy = models.CharField(max_length=100, null=True, blank=True)

    def __str__(self):
        return f"ETF: {self.asset.symbol}"


class ETFComponent(models.Model):

    etf = models.ForeignKey(ETF, on_delete=models.CASCADE, related_name='components')
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='etf_components')
    percentage = models.DecimalField(max_digits=5, decimal_places=2, help_text='Percentage weight (0-100)')

    def __str__(self):
        return f"{self.stock.symbol} {self.percentage}% in {self.etf.asset.symbol}"