export const replyResult = (result, req, rep) => {
  switch (result.type) {
    case "result":
      return rep.code(200).send({ code: 200, url: req.url, message: result.result });
    case "errorMsg":
      return rep.code(400).send({ code: 400, url: req.url, message: result.errorMsg });
    default: {
      return rep.code(500).send({ code: 500, url: req.url, message: "An unpredictable error" });
    }
  }
}

export const errorReplyCodes = {
  reply400: async (reasonError = "DEFAULT", errorMessage = "", req, rep) => {
    const reasonErrorTypes = {
      "INVALID_INPUT": "One or more input parameters are invalid",
      "MISSING_REQUIRED_FIELD": "A required field is missing from the request",
      "UNPROCESSABLE_DATA": "The server could not process the provided data",
      "DEFAULT": "Bad request"
    }
    errorMessage = !errorMessage ? reasonErrorTypes[reasonError] || reasonErrorTypes["DEFAULT"] : errorMessage;
    return rep.code(400).send({ code: 400, url: req.url, message: errorMessage });
  },
  reply401: async (reasonError = "DEFAULT", errorMessage = "", req, rep) => {
    const reasonErrorTypes = {
      "INVALID_CREDENTIALS": "Invalid username or password",
      "MISSING_TOKEN": "Authorization token is missing",
      "EXPIRED_TOKEN": "Authorization token has expired",
      "DEFAULT": "Unauthorized"
    }
    errorMessage = !errorMessage ? reasonErrorTypes[reasonError] || reasonErrorTypes["DEFAULT"] : errorMessage;
    return rep.code(401).send({ code: 401, url: req.url, message: errorMessage });
  },
  reply403: async (reasonError = "DEFAULT", errorMessage = "", req, rep) => {
    const reasonErrorTypes = {
      "INSUFFICIENT_PERMISSIONS": "You do not have permission to access this resource",
      "ACCOUNT_DISABLED": "Account is disabled",
      "DEFAULT": "Not access"
    }
    errorMessage = !errorMessage ? reasonErrorTypes[reasonError] || reasonErrorTypes["DEFAULT"] : errorMessage;
    return rep.code(403).send({ code: 403, url: req.url, message: errorMessage });
  },
  reply404: async (reasonError = "DEFAULT", errorMessage = "", req, rep) => {
    const reasonErrorTypes = {
      "RESOURCE_NOT_FOUND": "Resource not found",
      "ROUTE_NOT_FOUND": "Route not found",
      "DEFAULT": "Not found"
    }
    errorMessage = !errorMessage ? reasonErrorTypes[reasonError] || reasonErrorTypes["DEFAULT"] : errorMessage;
    return rep.code(404).send({ code: 404, url: req.url, message: errorMessage });
  },
  reply500: async (reasonError = "DEFAULT", errorMessage = "", req, rep) => {
    const reasonErrorTypes = {
      "DATABASE_ERROR": "A database error occurred",
      "THIRD_PARTY_API_ERROR": "Error communicating with a third-party API",
      "DEFAULT": "Bad request"
    }
    errorMessage = !errorMessage ? reasonErrorTypes[reasonError] || reasonErrorTypes["DEFAULT"] : reasonErrorTypes["DEFAULT"];
    return rep.code(500).send({ code: 500, url: req.url, message: errorMessage });
  },
}

export const selectDataInTable = async (options) => {
  try {
    if (!options || !options.table) {
      return { type: "Error", message: "Table name is required" };
    }
    const {
      table,
      columns = ['*'],
      where,
      orderBy,
      orderDirection = 'ASC',
      limit,
      offset,
      join,
      groupBy
    } = options;
    let sql = 'SELECT ';
    sql += Array.isArray(columns) ? columns.join(', ') : columns;
    sql += ' FROM ';
    let tableParts = [];
    if (Array.isArray(table)) {
      for (const item of table) {
        if (typeof item === 'string') {
          tableParts.push(item);
        } else if (Array.isArray(item) && item.length === 2) {
          tableParts.push(`${item[0]} AS ${item[1]}`);
        } else {
          return { type: 'Error', message: 'Invalid table format in FROM clause' };
        }
      }
    } else if (typeof table === 'string') {
      tableParts.push(table);
    } else {
      return { type: 'Error', message: 'Invalid table format' };
    }
    sql += tableParts.join(', ');
    if (join && Array.isArray(join) && join.length > 0) {
      join.forEach((joinItem) => {
        if (!joinItem.table || !joinItem.type || !joinItem.on) {
          return { type: "Error", message: "Join parameters (table, type, on) are required for each join" };
        }
        let joinTableSql = '';
        if (Array.isArray(joinItem.table)) {
          const joinTableParts = [];
          for (const joinItemTable of joinItem.table) {
            if (typeof joinItemTable === 'string') {
              joinTableParts.push(joinItemTable);
            } else if (Array.isArray(joinItemTable) && joinItemTable.length === 2) {
              joinTableParts.push(`${joinItemTable[0]} AS ${joinItemTable[1]}`);
            } else {
              return { type: "Error", message: "Invalid table format in JOIN clause" };
            }
          }
          joinTableSql = joinTableParts.join(', ');
        } else if (typeof joinItem.table === 'string') {
          joinTableSql = joinItem.table;
        }
        else {
          return { type: "Error", message: "Invalid table format in JOIN clause" };
        }
        sql += ` ${joinItem.type} ${joinTableSql} ON ${joinItem.on}`;
      });
    }
    const values = [];
    let valueIndex = 1;
    let whereClause = '';
    if (where) {
      const whereClauses = [];
      for (const key in where) {
        if (where.hasOwnProperty(key)) {
          const condition = where[key];
          if (typeof condition === 'object' && condition.operator !== undefined && condition.value !== undefined) {
            const { operator, value } = condition;
            whereClauses.push(`${key} ${operator} $${valueIndex}`);
            values.push(value);
            valueIndex++;
          } else if (condition === null) {
            whereClauses.push(`${key} IS NULL`);
          } else if (condition !== undefined) {
            whereClauses.push(`${key} = $${valueIndex}`);
            values.push(condition);
            valueIndex++;
          }
        }
      }
      if (whereClauses.length > 0) {
        whereClause = ' WHERE ' + whereClauses.join(' AND ');
        sql += whereClause;
      }
    }
    if (groupBy && Array.isArray(groupBy) && groupBy.length > 0) {
      sql += ` GROUP BY ${groupBy.join(", ")}`;
    }
    if (orderBy) {
      sql += ` ORDER BY ${orderBy} ${orderDirection.toUpperCase()}`;
    }
    if (limit && !(typeof limit !== 'number' || limit <= 0)) {
      sql += ` LIMIT $${valueIndex}`;
      values.push(limit);
      valueIndex++;
    }
    if (offset && !(typeof offset !== 'number' || offset < 0)) {
      sql += ` OFFSET $${valueIndex}`;
      values.push(offset);
      valueIndex++;
    }
    return {
      type: "Success",
      message: sql,
      values: values,
    };
  } catch (error) {
    console.error('Error at created sql request:', error);
    return { type: "Error", message: "An unpredictable error" };
  }
}

export const insertDataInTable = async (options) => {
  try {
    const { tableName, data, requiredFields = [], returningColumns = [] } = options;
    if (!tableName || typeof tableName !== 'string' || tableName.trim() === '') {
      return { type: "Error", message: "You need to specify the name of the table" };
    }
    if (!data || Object.keys(data).length === 0) {
      return { type: "Error", message: "You need to specify the table data" };
    }
    if (!requiredFields || requiredFields.length === 0) {
      console.warn("No required fields specified. Skipping validation");
    } else {
      const missingFields = requiredFields.filter(field => !data.hasOwnProperty(field) || data[field] === null || data[field] === undefined);
      if (missingFields.length > 0) {
        return { type: "Error", message: `Missing required fields for INSERT: ${missingFields.join(', ')}` };
      }
    }
    const columns = Object.keys(data);
    let values = new Map();
    let setClauses = [];
    let paramIndex = 1;
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const value = data[key];
        if (value === undefined || value === null || (typeof value === 'string' && value === '')) {
          setClauses.push(`"${key}" = NULL`);
        } else if (Array.isArray(value)) {
          setClauses.push(`UNNEST($${paramIndex})`);
          values.set(key, value);
          paramIndex++;
        } else if (typeof value === 'object' && value !== null) {
          setClauses.push(`$${paramIndex}`);
          values.set(key, JSON.stringify(value));
          paramIndex++;
        } else if (value === 'DEFAULT') {
          setClauses.push(`DEFAULT`);
        } else if(value === 'CURRENT_TIMESTAMP') {
          setClauses.push(`CURRENT_TIMESTAMP`);
        } else {
          setClauses.push(`$${paramIndex}`);
          values.set(key, value);
          paramIndex++;
        }
      }
    }
    const columnList = columns.join(', ');
    const valueList = setClauses.join(', ');
    let sql = `INSERT INTO ${tableName} (${columnList}) VALUES (${valueList})`;
    if (returningColumns && returningColumns.length > 0) {
      const returningString = returningColumns.map(col => `"${col}"`).join(', ');
      sql += ` RETURNING ${returningString};`;
    }
    return { type: "Success", message: sql, values: values };
  } catch (error) {
    console.error('Error at created sql request:', error);
    return { type: "Error", message: "An unpredictable error" };
  }
}

export const updateDataInTable = async (options) => {
  try {
    const { tableName, data, whereClause = {}, requiredFields = [], returningColumns = [] } = options;
    if (!tableName || typeof tableName !== 'string' || tableName.trim() === '') {
      return { type: "Error", message: "You need to specify the name of the table" };
    }
    if (!data || Object.keys(data).length === 0) {
      return { type: "Error", message: "You need to specify the table data" };
    }
    if (!whereClause || typeof whereClause !== 'object' || Object.keys(whereClause).length === 0) {
      return { type: "Error", message: "You need to specify the conditions (WHERE)" };
    }
    if (!requiredFields || requiredFields.length === 0) {
      console.warn("No required fields specified. Skipping validation");
    } else {
      const missingFields = requiredFields.filter(field => data.hasOwnProperty(field) && (data[field] === null || data[field] === undefined));
      if (missingFields.length > 0) {
        return { type: "Error", message: `Missing required fields for INSERT: ${missingFields.join(', ')}` };
      }
    }
    let setClauses = [];
    let values = new Map();
    let paramIndex = 1;
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const value = data[key];
        if (value === undefined || value === null || (typeof value === 'string' && value === '')) {
          setClauses.push(`"${key}" = NULL`);
        } else if (typeof value === 'object' && value !== null) {
          setClauses.push(`"${key}" = $${paramIndex}`);
          values.set(key, JSON.stringify(value));
          paramIndex++;
        } else if (Array.isArray(value)) {
          setClauses.push(`"${key}" = UNNEST($${paramIndex})`);
          values.set(key, value);
          paramIndex++;
        } else if (typeof value === 'object' && value !== null) {
          setClauses.push(`"${key}" = $${paramIndex}`);
          values.set(key, JSON.stringify(value));
          paramIndex++;
        } else if (value === 'DEFAULT') {
          setClauses.push(`"${key}" = DEFAULT`);
        } else {
          setClauses.push(`"${key}" = $${paramIndex}`);
          values.set(key, value);
          paramIndex++;
        }
      }
    }
    let whereClauses = [];
    for (const key in whereClause) {
      if (whereClause.hasOwnProperty(key)) {
        whereClauses.push(`"${key}" = $${paramIndex}`);
        values.set(key, whereClause[key]);
        paramIndex++;
      }
    }
    if (setClauses.length === 0) {
      return { type: "Error", message: 'There is not data to update' };
    }
    if (whereClauses.length === 0) {
      return { type: "Error", message: 'The conditions for updating are not specified' };
    }
    const setString = setClauses.join(', ');
    const whereString = whereClauses.join(' AND ');
    let sql = `
      UPDATE "${tableName}"
      SET ${setString}
      WHERE ${whereString}
    `;
    if (returningColumns && returningColumns.length > 0) {
      const returningString = returningColumns.map(col => `"${col}"`).join(', ');
      sql += ` RETURNING ${returningString}`;
    }
    return { type: "Success", message: sql, values: values };
  } catch (error) {
    console.error('Error at created sql request:', error);
    return { type: "Error", message: "An unpredictable error" };
  }
}