from fastapi.templating import Jinja2Templates
from datetime import datetime
import json
from markupsafe import Markup

templates = Jinja2Templates(directory="templates")


def _fmt_datetime(value, fmt="%d/%m/%Y %H:%M"):
    if value is None:
        return ""
    if isinstance(value, datetime):
        return value.strftime(fmt)
    return str(value)


def _fmt_date(value):
    return _fmt_datetime(value, "%d/%m/%Y")


def _tojson(obj):
    return Markup(json.dumps(obj, ensure_ascii=False))

templates.env.filters["dt"] = _fmt_datetime
templates.env.filters["date"] = _fmt_date
templates.env.filters["tojson"] = _tojson
templates.env.globals["now"] = datetime.now
