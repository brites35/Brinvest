from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.conf import settings
from .models import User, Asset, Stock, ETF, ETFComponent
import finnhub

finnhub_client = finnhub.Client(api_key=settings.FINNHUB_API_KEY)

def index(request):

    return render(request, "Brinvest/index.html")


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "Brinvest/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "Brinvest/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "Brinvest/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "Brinvest/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "Brinvest/register.html")


def stocks_view(request):
    return render(request, "Brinvest/index.html")

def stock_detail_view(request, symbol):
    return render(request, "Brinvest/index.html")

def etfs_view(request):
    return render(request, "Brinvest/index.html")

def currency_view(request):
    return render(request, "Brinvest/index.html")

def news_view(request):
    return render(request, "Brinvest/index.html")

def watchlist_view(request):
    return render(request, "Brinvest/index.html")


def stocks_data(request):
    """Return JSON list of assets from DB for the Top Stocks widget.

    Fields: symbol, name, price, market_cap, pe_ratio, dividend_yield
    """
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    # Query Stock and include related Asset to access asset fields efficiently
    qs = Stock.objects.select_related('asset').order_by('-asset__market_cap')[:50]
    data = []
    for s in qs:
        a = s.asset
        data.append({
            'symbol': a.symbol,
            'price': float(a.price) if a.price is not None else None,
            'name': a.name,
            'market_cap': a.market_cap,
        })
    return JsonResponse(data, safe=False)
