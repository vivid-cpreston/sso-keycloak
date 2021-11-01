const { Client } = require('pg');

const PGHOST = process.env.PGHOST || 'localhost';
const PGPORT = process.env.PGPORT || '5432';
const PGUSER = process.env.PGUSER || 'postgres';
const PGPASSWORD = process.env.PGPASSWORD || 'postgres';
const PGDATABASE = process.env.PGDATABASE || 'postgres';

const createTable = `
CREATE TABLE IF NOT EXISTS sso_stats (
  realm_id varchar(255),
  date date,
  login integer,
  code_to_token integer,
  refresh_token integer,
  user_info_request integer,
  introspect_token integer,
  client_login integer,
  refresh_token_error integer,
  login_error integer,
  UNIQUE (realm_id, date)
);
`

const createFunction = `
CREATE OR REPLACE FUNCTION save_log_types ()
RETURNS TRIGGER
AS $BODY$
DECLARE
event_types text[];
event_type character varying;
counter character varying;
BEGIN
counter := '';
event_types := ARRAY['LOGIN', 'CODE_TO_TOKEN', 'REFRESH_TOKEN', 'USER_INFO_REQUEST', 'INTROSPECT_TOKEN', 'CLIENT_LOGIN', 'REFRESH_TOKEN_ERROR', 'LOGIN_ERROR'];
FOREACH event_type IN ARRAY event_types LOOP
  EXECUTE format('
INSERT INTO sso_stats (realm_id, %s, date)
SELECT
  message ->> %L AS realm_id,
  count(message ->> %L) AS %s,
  DATE(timestamp) AS date
FROM
  sso_logs
WHERE
  message ->> %L = %L
GROUP BY
  message ->> %L,
  message ->> %L,
  DATE(timestamp)
ON CONFLICT (date, realm_id) DO UPDATE set %s = excluded.%s;
 ', event_type, 'realmId', 'type', event_type, 'type', event_type, 'realmId', 'type', event_type, event_type);
END LOOP;
RETURN NULL;
END;
$BODY$
LANGUAGE 'plpgsql';
`

const createTrigger = `
DROP TRIGGER IF EXISTS update_stats
  ON public.sso_logs;
CREATE TRIGGER update_stats
  AFTER INSERT ON sso_logs
  EXECUTE PROCEDURE save_log_types ();
`

const getClient = () => {
  const client = new Client({
    host: PGHOST,
    port: parseInt(PGPORT),
    user: PGUSER,
    password: PGPASSWORD,
    database: PGDATABASE,
    ssl: { rejectUnauthorized: false },
  });
  return client;
}

async function main() {
  try {
    const client = getClient();
    await client.connect();
    await client.query(createTable);
    await client.query(createFunction);
    await client.query(createTrigger);
    await client.end();
  } catch (err) {
    console.log(err);
  }
}

main();
