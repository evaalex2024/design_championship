import pymysql
import pymysql.cursors
import config


def get_db():
    """Open a new connection to the MySQL database.

    Each request gets its own connection and closes it when done —
    simple and easy to reason about for a project this size.
    """
    return pymysql.connect(
        host=config.DB_HOST,
        user=config.DB_USER,
        password=config.DB_PASSWORD,
        database=config.DB_NAME,
        port=config.DB_PORT,
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True,
    )
