import time
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.conf import settings

from Brinvest.models import Asset, Stock
import finnhub

logger = logging.getLogger(__name__)

# keep a short list here or import from somewhere central
TOP_50_SYMBOLS = ["AAPL","MSFT","AMZN","GOOGL","GOOG","META","NVDA","TSLA","BRK.B","JPM","JNJ","V","PG","XOM","MA","UNH","HD","LLY","PFE","BAC","ABBV","PEP","KO","MRK","AVGO","NFLX"]

finnhub_client = finnhub.Client(api_key=getattr(settings, 'FINNHUB_API_KEY', None))

# tune these values for your environment / API limits
WORKERS = 1
SLEEP_SECONDS = 60


def fetch_quote(symbol):
    try:
        q = finnhub_client.quote(symbol)
        return symbol, q
    except Exception as e:
        return symbol, {'error': str(e)}


class Command(BaseCommand):
    help = 'Continuously update Asset prices from Finnhub (run as separate process)'

    def add_arguments(self, parser):
        parser.add_argument('--once', action='store_true', help='Run one cycle and exit')
        parser.add_argument('--sleep', type=int, default=SLEEP_SECONDS)

    def handle(self, *args, **options):
        once = options.get('once', False)
        sleep_seconds = options.get('sleep', SLEEP_SECONDS)

        logger.info('Starting update_assets (once=%s, sleep=%s)', once, sleep_seconds)

        try:
            while True:
                symbols = TOP_50_SYMBOLS

                # fetch existing assets in one query
                existing_assets = {a.symbol: a for a in Asset.objects.filter(symbol__in=symbols)}

                results = []
                with ThreadPoolExecutor(max_workers=WORKERS) as ex:
                    futures = {ex.submit(fetch_quote, s): s for s in symbols}
                    for fut in as_completed(futures):
                        sym, payload = fut.result()
                        results.append((sym, payload))

                to_update = []
                to_create = []

                for sym, quote in results:
                    if isinstance(quote, dict) and quote.get('error'):
                        logger.warning('Quote failed for %s: %s', sym, quote.get('error'))
                        continue
                    current = quote.get('c')
                    if current is None:
                        continue
                    # convert to Decimal for DB field
                    try:
                        price_dec = Decimal(str(current))
                    except Exception:
                        price_dec = None

                    if sym in existing_assets:
                        asset = existing_assets[sym]
                        asset.price = price_dec
                        asset.last_updated = timezone.now()
                        to_update.append(asset)
                    else:
                        new_asset = Asset(symbol=sym, name=sym, price=price_dec, last_updated=timezone.now())
                        to_create.append(new_asset)

                if to_create:
                    Asset.objects.bulk_create(to_create)
                    # create Stocks for new assets
                    created = Asset.objects.filter(symbol__in=[a.symbol for a in to_create])
                    Stock.objects.bulk_create([Stock(asset=a) for a in created])

                if to_update:
                    Asset.objects.bulk_update(to_update, ['price', 'last_updated'])

                logger.info('Cycle complete. Updated %d assets, created %d new', len(to_update), len(to_create))

                if once:
                    break
                time.sleep(sleep_seconds)

        except KeyboardInterrupt:
            logger.info('Updater interrupted; exiting')
