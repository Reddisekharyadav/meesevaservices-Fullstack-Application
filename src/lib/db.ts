import sql from 'mssql';

const config: sql.config = {
  server: process.env.AZURE_SQL_SERVER || '',
  database: process.env.AZURE_SQL_DATABASE || '',
  user: process.env.AZURE_SQL_USER || '',
  password: process.env.AZURE_SQL_PASSWORD || '',
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: sql.ConnectionPool | null = null;

export async function getConnection(): Promise<sql.ConnectionPool> {
  if (pool) {
    return pool;
  }
  
  pool = await sql.connect(config);
  return pool;
}

export async function query<T>(
  queryString: string,
  params?: Record<string, unknown>
): Promise<T[]> {
  const connection = await getConnection();
  const request = connection.request();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });
  }
  
  const result = await request.query(queryString);
  return result.recordset as T[];
}

export async function queryOne<T>(
  queryString: string,
  params?: Record<string, unknown>
): Promise<T | null> {
  const results = await query<T>(queryString, params);
  return results[0] || null;
}

export async function execute(
  queryString: string,
  params?: Record<string, unknown>
): Promise<sql.IResult<unknown>> {
  const connection = await getConnection();
  const request = connection.request();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });
  }
  
  return request.query(queryString);
}

export { sql };
