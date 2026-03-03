
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("currency", views.currency_view, name="currency"),
    path("news", views.news_view, name="news"),
    path("watchlist", views.watchlist_view, name="watchlist"),
    path("stocks", views.stocks_view, name="stocks"),
    path("stock/<str:symbol>", views.stock_detail_view, name="stock_detail"),
    
    #API Routes
    path("api/stocks", views.stocks_data, name="stocks_data"),
]
