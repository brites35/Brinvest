
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("stocks", views.stocks_view, name="stocks"),
    path("etfs", views.etfs_view, name="etfs"),
    path("currency", views.currency_view, name="currency"),
    path("news", views.news_view, name="news"),
    path("watchlist", views.watchlist_view, name="watchlist"),
    
    #API Routes
    path("api/stocks", views.stocks_data, name="stocks_data"),
]
