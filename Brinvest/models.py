from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    wacth_list = models.ManyToManyField("Asset", related_name="watched_by", blank=True)

    pass


class Asset(models.Model):
    symbol = models.CharField(max_length=10, unique=True, primary_key=True)
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    last_updated = models.DateTimeField(null=True, blank=True)
    market_cap = models.BigIntegerField(null=True, blank=True)
    pe_ratio = models.FloatField(null=True, blank=True)
    shares_outs = models.BigIntegerField(null=True, blank=True)
    dividend_yield = models.FloatField(null=True, blank=True)
    exchange = models.CharField(max_length=50, null=True, blank=True)
    watchlist = models.ManyToManyField("Watchlist", related_name="assets_in_watchlists", blank=True)

    def __str__(self):
        return f"{self.name} ({self.symbol})"
    
class Watchlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="watchlists")
    name = models.CharField(max_length=100, default="My Watchlist")
    assets = models.ManyToManyField(Asset, related_name="in_watchlists", blank=True)

    def __str__(self):
        return f"{self.name} ({self.user.username})"

class News(models.Model):
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name="news")
    title = models.CharField(max_length=255)
    url = models.URLField()
    published_at = models.DateTimeField()
    image_url = models.URLField(null=True, blank=True)

    def __str__(self):
        return f"{self.title} ({self.asset.symbol})"