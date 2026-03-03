import time
import logging
from decimal import Decimal
from concurrent.futures import ThreadPoolExecutor, as_completed

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.conf import settings
from django.db import transaction

from Brinvest.models import Asset, Stock
import finnhub

logger = logging.getLogger(__name__)

TOP_50_SYMBOLS = [
    "AAPL","MSFT","NVDA","AMZN","GOOGL","META","TSLA","BRK.B","LLY","AVGO",
    "JPM","V","MA","UNH","XOM","HD","PG","COST","JNJ","MRK",
    "ABBV","PEP","KO","BAC","WMT","CRM","ADBE","CSCO","AMD","ORCL",
    "TMO","NFLX","MCD","ACN","DHR","INTC","TXN","AMAT","QCOM","NEE",
    "LIN","PM","RTX","UPS","LOW","HON","SPGI","IBM","CAT","GS"
]

WORKERS = 2
SLEEP_SECONDS = 90
MAX_RETRIES = 3

finnhub_client = finnhub.Client(api_key=settings.FINNHUB_API_KEY)


# --------------------------------------------------
# SAFE FINNHUB CALL WITH RETRIES
# --------------------------------------------------

def safe_finnhub_call(func, **kwargs):
    for attempt in range(MAX_RETRIES):
        try:
            return func(**kwargs)
        except Exception as e:
            logger.warning("Finnhub error (%s). Retry %d/%d",
                           str(e), attempt + 1, MAX_RETRIES)
            time.sleep(1.5 * (attempt + 1))
    return None


def fetch_quote(symbol):
    data = safe_finnhub_call(finnhub_client.quote, symbol=symbol)
    return symbol, data or {}


def fetch_profile(symbol):
    data = safe_finnhub_call(finnhub_client.company_profile2, symbol=symbol)
    return symbol, data or {}


# --------------------------------------------------
# MANAGEMENT COMMAND
# --------------------------------------------------

class Command(BaseCommand):
    help = "Continuously update Asset prices from Finnhub"

    def add_arguments(self, parser):
        parser.add_argument("--once", action="store_true")
        parser.add_argument("--sleep", type=int, default=SLEEP_SECONDS)

    def handle(self, *args, **options):
        once = options["once"]
        sleep_seconds = options["sleep"]

        logger.info("Starting updater (once=%s)", once)

        while True:
            start_time = time.time()

            symbols = TOP_50_SYMBOLS

            # Fetch existing assets in one query
            existing_assets = {
                a.symbol: a
                for a in Asset.objects.filter(symbol__in=symbols)
            }

            # -----------------------------
            # FETCH QUOTES
            # -----------------------------
            results = []

            with ThreadPoolExecutor(max_workers=WORKERS) as executor:
                futures = {
                    executor.submit(fetch_quote, s): s
                    for s in symbols
                }
                for future in as_completed(futures):
                    results.append(future.result())

            # -----------------------------
            # FETCH PROFILES (ONLY IF NEEDED)
            # -----------------------------
            need_profiles = [
                sym for sym, _ in results
                if sym not in existing_assets
                or not existing_assets[sym].name
                or existing_assets[sym].name == sym
                or existing_assets[sym].market_cap is None
            ]

            profiles = {}

            if need_profiles:
                for sym in need_profiles:
                    # Avoid rate-limit bursts
                    time.sleep(0.2)
                    _, profile = fetch_profile(sym)
                    profiles[sym] = profile

            # -----------------------------
            # PREPARE BULK OPERATIONS
            # -----------------------------
            to_update = []
            to_create = []

            for sym, quote in results:
                current_price = quote.get("c")
                if not current_price:
                    continue

                price = Decimal(str(current_price))

                profile = profiles.get(sym, {})
                name = profile.get("name") or sym
                marketCap = profile.get("marketCapitalization")

                if sym in existing_assets:
                    asset = existing_assets[sym]
                    asset.price = price
                    asset.last_updated = timezone.now()

                    if asset.name == asset.symbol:
                        asset.name = name

                    if asset.market_cap is None:
                        asset.market_cap = marketCap

                    to_update.append(asset)
                else:
                    to_create.append(
                        Asset(
                            symbol=sym,
                            name=name,
                            market_cap=marketCap,
                            price=price,
                            last_updated=timezone.now()
                        )
                    )

            # -----------------------------
            # ATOMIC DATABASE UPDATE
            # -----------------------------
            with transaction.atomic():
                if to_create:
                    Asset.objects.bulk_create(to_create)

                    created_assets = Asset.objects.filter(
                        symbol__in=[a.symbol for a in to_create]
                    )

                    Stock.objects.bulk_create(
                        [Stock(asset=a) for a in created_assets]
                    )

                if to_update:
                    Asset.objects.bulk_update(
                        to_update,
                        ["price", "last_updated", "name", "market_cap"]
                    )

            duration = round(time.time() - start_time, 2)

            logger.info(
                "Cycle complete in %ss | Updated: %d | Created: %d",
                duration,
                len(to_update),
                len(to_create)
            )

            if once:
                break

            time.sleep(sleep_seconds)