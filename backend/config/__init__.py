"""Ensure PyMySQL works transparently as MySQLdb if mysqlclient C-extension is unavailable."""

try:
    import MySQLdb  # noqa: F401
except ImportError:
    try:
        import pymysql
        pymysql.install_as_MySQLdb()
    except ImportError:
        pass
