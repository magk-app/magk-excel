from typing import List, Optional, TypedDict

from localstack.aws.api import RequestContext, ServiceException, ServiceRequest, handler

Arn = str
Boolean = bool
BoxedBoolean = bool
BoxedDouble = float
BoxedFloat = float
BoxedInteger = int
DbName = str
ErrorMessage = str
FormattedSqlRecords = str
Id = str
Integer = int
ParameterName = str
SqlStatement = str
String = str
TransactionStatus = str


class DecimalReturnType(str):
    STRING = "STRING"
    DOUBLE_OR_LONG = "DOUBLE_OR_LONG"


class LongReturnType(str):
    STRING = "STRING"
    LONG = "LONG"


class RecordsFormatType(str):
    NONE = "NONE"
    JSON = "JSON"


class TypeHint(str):
    JSON = "JSON"
    UUID = "UUID"
    TIMESTAMP = "TIMESTAMP"
    DATE = "DATE"
    TIME = "TIME"
    DECIMAL = "DECIMAL"


class AccessDeniedException(ServiceException):
    """You do not have sufficient access to perform this action."""

    code: str = "AccessDeniedException"
    sender_fault: bool = True
    status_code: int = 403


class BadRequestException(ServiceException):
    """There is an error in the call or in a SQL statement."""

    code: str = "BadRequestException"
    sender_fault: bool = True
    status_code: int = 400


class ForbiddenException(ServiceException):
    """There are insufficient privileges to make the call."""

    code: str = "ForbiddenException"
    sender_fault: bool = True
    status_code: int = 403


class InternalServerErrorException(ServiceException):
    """An internal error occurred."""

    code: str = "InternalServerErrorException"
    sender_fault: bool = False
    status_code: int = 500


class NotFoundException(ServiceException):
    """The ``resourceArn``, ``secretArn``, or ``transactionId`` value can't be
    found.
    """

    code: str = "NotFoundException"
    sender_fault: bool = True
    status_code: int = 404


class ServiceUnavailableError(ServiceException):
    """The service specified by the ``resourceArn`` parameter is not available."""

    code: str = "ServiceUnavailableError"
    sender_fault: bool = False
    status_code: int = 503


Long = int


class StatementTimeoutException(ServiceException):
    """The execution of the SQL statement timed out."""

    code: str = "StatementTimeoutException"
    sender_fault: bool = True
    status_code: int = 400
    dbConnectionId: Optional[Long]


ArrayOfArray = List["ArrayValue"]
StringArray = List[String]
DoubleArray = List[BoxedDouble]
BoxedLong = int
LongArray = List[BoxedLong]
BooleanArray = List[BoxedBoolean]


class ArrayValue(TypedDict, total=False):
    """Contains an array."""

    booleanValues: Optional[BooleanArray]
    longValues: Optional[LongArray]
    doubleValues: Optional[DoubleArray]
    stringValues: Optional[StringArray]
    arrayValues: Optional[ArrayOfArray]


ArrayValueList = List["Value"]


class StructValue(TypedDict, total=False):
    """A structure value returned by a call.

    This data structure is only used with the deprecated ``ExecuteSql``
    operation. Use the ``BatchExecuteStatement`` or ``ExecuteStatement``
    operation instead.
    """

    attributes: Optional[ArrayValueList]


Blob = bytes


class Value(TypedDict, total=False):
    """Contains the value of a column.

    ::

        <note> <p>This data structure is only used with the deprecated <code>ExecuteSql</code> operation. Use the <code>BatchExecuteStatement</code> or <code>ExecuteStatement</code> operation instead.</p> </note>
    """

    isNull: Optional[BoxedBoolean]
    bitValue: Optional[BoxedBoolean]
    bigIntValue: Optional[BoxedLong]
    intValue: Optional[BoxedInteger]
    doubleValue: Optional[BoxedDouble]
    realValue: Optional[BoxedFloat]
    stringValue: Optional[String]
    blobValue: Optional[Blob]
    arrayValues: Optional[ArrayValueList]
    structValue: Optional[StructValue]


class Field(TypedDict, total=False):
    """Contains a value."""

    isNull: Optional[BoxedBoolean]
    booleanValue: Optional[BoxedBoolean]
    longValue: Optional[BoxedLong]
    doubleValue: Optional[BoxedDouble]
    stringValue: Optional[String]
    blobValue: Optional[Blob]
    arrayValue: Optional[ArrayValue]


class SqlParameter(TypedDict, total=False):
    """A parameter used in a SQL statement."""

    name: Optional[ParameterName]
    value: Optional[Field]
    typeHint: Optional[TypeHint]


SqlParametersList = List[SqlParameter]
SqlParameterSets = List[SqlParametersList]


class BatchExecuteStatementRequest(ServiceRequest):
    """The request parameters represent the input of a SQL statement over an
    array of data.
    """

    resourceArn: Arn
    secretArn: Arn
    sql: SqlStatement
    database: Optional[DbName]
    schema: Optional[DbName]
    parameterSets: Optional[SqlParameterSets]
    transactionId: Optional[Id]


FieldList = List[Field]


class UpdateResult(TypedDict, total=False):
    """The response elements represent the results of an update."""

    generatedFields: Optional[FieldList]


UpdateResults = List[UpdateResult]


class BatchExecuteStatementResponse(TypedDict, total=False):
    """The response elements represent the output of a SQL statement over an
    array of data.
    """

    updateResults: Optional[UpdateResults]


class BeginTransactionRequest(ServiceRequest):
    """The request parameters represent the input of a request to start a SQL
    transaction.
    """

    resourceArn: Arn
    secretArn: Arn
    database: Optional[DbName]
    schema: Optional[DbName]


class BeginTransactionResponse(TypedDict, total=False):
    """The response elements represent the output of a request to start a SQL
    transaction.
    """

    transactionId: Optional[Id]


ColumnMetadata = TypedDict(
    "ColumnMetadata",
    {
        "name": Optional[String],
        "type": Optional[Integer],
        "typeName": Optional[String],
        "label": Optional[String],
        "schemaName": Optional[String],
        "tableName": Optional[String],
        "isAutoIncrement": Optional[Boolean],
        "isSigned": Optional[Boolean],
        "isCurrency": Optional[Boolean],
        "isCaseSensitive": Optional[Boolean],
        "nullable": Optional[Integer],
        "precision": Optional[Integer],
        "scale": Optional[Integer],
        "arrayBaseColumnType": Optional[Integer],
    },
    total=False,
)


class CommitTransactionRequest(ServiceRequest):
    """The request parameters represent the input of a commit transaction
    request.
    """

    resourceArn: Arn
    secretArn: Arn
    transactionId: Id


class CommitTransactionResponse(TypedDict, total=False):
    """The response elements represent the output of a commit transaction
    request.
    """

    transactionStatus: Optional[TransactionStatus]


class ExecuteSqlRequest(ServiceRequest):
    """The request parameters represent the input of a request to run one or
    more SQL statements.
    """

    dbClusterOrInstanceArn: Arn
    awsSecretStoreArn: Arn
    sqlStatements: SqlStatement
    database: Optional[DbName]
    schema: Optional[DbName]


RecordsUpdated = int
Row = List[Value]


class Record(TypedDict, total=False):
    """A record returned by a call.

    This data structure is only used with the deprecated ``ExecuteSql``
    operation. Use the ``BatchExecuteStatement`` or ``ExecuteStatement``
    operation instead.
    """

    values: Optional[Row]


Records = List[Record]
Metadata = List[ColumnMetadata]


class ResultSetMetadata(TypedDict, total=False):
    """The metadata of the result set returned by a SQL statement."""

    columnCount: Optional[Long]
    columnMetadata: Optional[Metadata]


class ResultFrame(TypedDict, total=False):
    """The result set returned by a SQL statement.

    This data structure is only used with the deprecated ``ExecuteSql``
    operation. Use the ``BatchExecuteStatement`` or ``ExecuteStatement``
    operation instead.
    """

    resultSetMetadata: Optional[ResultSetMetadata]
    records: Optional[Records]


class SqlStatementResult(TypedDict, total=False):
    """The result of a SQL statement.

    ::

        <note> <p>This data structure is only used with the deprecated <code>ExecuteSql</code> operation. Use the <code>BatchExecuteStatement</code> or <code>ExecuteStatement</code> operation instead.</p> </note>
    """

    resultFrame: Optional[ResultFrame]
    numberOfRecordsUpdated: Optional[RecordsUpdated]


SqlStatementResults = List[SqlStatementResult]


class ExecuteSqlResponse(TypedDict, total=False):
    """The response elements represent the output of a request to run one or
    more SQL statements.
    """

    sqlStatementResults: Optional[SqlStatementResults]


class ResultSetOptions(TypedDict, total=False):
    """Options that control how the result set is returned."""

    decimalReturnType: Optional[DecimalReturnType]
    longReturnType: Optional[LongReturnType]


class ExecuteStatementRequest(ServiceRequest):
    """The request parameters represent the input of a request to run a SQL
    statement against a database.
    """

    resourceArn: Arn
    secretArn: Arn
    sql: SqlStatement
    database: Optional[DbName]
    schema: Optional[DbName]
    parameters: Optional[SqlParametersList]
    transactionId: Optional[Id]
    includeResultMetadata: Optional[Boolean]
    continueAfterTimeout: Optional[Boolean]
    resultSetOptions: Optional[ResultSetOptions]
    formatRecordsAs: Optional[RecordsFormatType]


SqlRecords = List[FieldList]


class ExecuteStatementResponse(TypedDict, total=False):
    """The response elements represent the output of a request to run a SQL
    statement against a database.
    """

    records: Optional[SqlRecords]
    columnMetadata: Optional[Metadata]
    numberOfRecordsUpdated: Optional[RecordsUpdated]
    generatedFields: Optional[FieldList]
    formattedRecords: Optional[FormattedSqlRecords]


class RollbackTransactionRequest(ServiceRequest):
    """The request parameters represent the input of a request to perform a
    rollback of a transaction.
    """

    resourceArn: Arn
    secretArn: Arn
    transactionId: Id


class RollbackTransactionResponse(TypedDict, total=False):
    """The response elements represent the output of a request to perform a
    rollback of a transaction.
    """

    transactionStatus: Optional[TransactionStatus]


class RdsDataApi:
    service = "rds-data"
    version = "2018-08-01"

    @handler("BatchExecuteStatement")
    def batch_execute_statement(
        self,
        context: RequestContext,
        resource_arn: Arn,
        secret_arn: Arn,
        sql: SqlStatement,
        database: DbName = None,
        schema: DbName = None,
        parameter_sets: SqlParameterSets = None,
        transaction_id: Id = None,
    ) -> BatchExecuteStatementResponse:
        """Runs a batch SQL statement over an array of data.

        You can run bulk update and insert operations for multiple records using
        a DML statement with different parameter sets. Bulk operations can
        provide a significant performance improvement over individual insert and
        update operations.

        If a call isn't part of a transaction because it doesn't include the
        ``transactionID`` parameter, changes that result from the call are
        committed automatically.

        There isn't a fixed upper limit on the number of parameter sets.
        However, the maximum size of the HTTP request submitted through the Data
        API is 4 MiB. If the request exceeds this limit, the Data API returns an
        error and doesn't process the request. This 4-MiB limit includes the
        size of the HTTP headers and the JSON notation in the request. Thus, the
        number of parameter sets that you can include depends on a combination
        of factors, such as the size of the SQL statement and the size of each
        parameter set.

        The response size limit is 1 MiB. If the call returns more than 1 MiB of
        response data, the call is terminated.

        :param resource_arn: The Amazon Resource Name (ARN) of the Aurora Serverless DB cluster.
        :param secret_arn: The ARN of the secret that enables access to the DB cluster.
        :param sql: The SQL statement to run.
        :param database: The name of the database.
        :param schema: The name of the database schema.
        :param parameter_sets: The parameter set for the batch operation.
        :param transaction_id: The identifier of a transaction that was started by using the
        ``BeginTransaction`` operation.
        :returns: BatchExecuteStatementResponse
        :raises AccessDeniedException:
        :raises BadRequestException:
        :raises StatementTimeoutException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        :raises ServiceUnavailableError:
        """
        raise NotImplementedError

    @handler("BeginTransaction")
    def begin_transaction(
        self,
        context: RequestContext,
        resource_arn: Arn,
        secret_arn: Arn,
        database: DbName = None,
        schema: DbName = None,
    ) -> BeginTransactionResponse:
        """Starts a SQL transaction.

        A transaction can run for a maximum of 24 hours. A transaction is
        terminated and rolled back automatically after 24 hours.

        A transaction times out if no calls use its transaction ID in three
        minutes. If a transaction times out before it's committed, it's rolled
        back automatically.

        DDL statements inside a transaction cause an implicit commit. We
        recommend that you run each DDL statement in a separate
        ``ExecuteStatement`` call with ``continueAfterTimeout`` enabled.

        :param resource_arn: The Amazon Resource Name (ARN) of the Aurora Serverless DB cluster.
        :param secret_arn: The name or ARN of the secret that enables access to the DB cluster.
        :param database: The name of the database.
        :param schema: The name of the database schema.
        :returns: BeginTransactionResponse
        :raises AccessDeniedException:
        :raises BadRequestException:
        :raises StatementTimeoutException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        :raises ServiceUnavailableError:
        """
        raise NotImplementedError

    @handler("CommitTransaction")
    def commit_transaction(
        self, context: RequestContext, resource_arn: Arn, secret_arn: Arn, transaction_id: Id
    ) -> CommitTransactionResponse:
        """Ends a SQL transaction started with the ``BeginTransaction`` operation
        and commits the changes.

        :param resource_arn: The Amazon Resource Name (ARN) of the Aurora Serverless DB cluster.
        :param secret_arn: The name or ARN of the secret that enables access to the DB cluster.
        :param transaction_id: The identifier of the transaction to end and commit.
        :returns: CommitTransactionResponse
        :raises AccessDeniedException:
        :raises BadRequestException:
        :raises StatementTimeoutException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        :raises ServiceUnavailableError:
        :raises NotFoundException:
        """
        raise NotImplementedError

    @handler("ExecuteSql")
    def execute_sql(
        self,
        context: RequestContext,
        db_cluster_or_instance_arn: Arn,
        aws_secret_store_arn: Arn,
        sql_statements: SqlStatement,
        database: DbName = None,
        schema: DbName = None,
    ) -> ExecuteSqlResponse:
        """Runs one or more SQL statements.

        This operation is deprecated. Use the ``BatchExecuteStatement`` or
        ``ExecuteStatement`` operation.

        :param db_cluster_or_instance_arn: The ARN of the Aurora Serverless DB cluster.
        :param aws_secret_store_arn: The Amazon Resource Name (ARN) of the secret that enables access to the
        DB cluster.
        :param sql_statements: One or more SQL statements to run on the DB cluster.
        :param database: The name of the database.
        :param schema: The name of the database schema.
        :returns: ExecuteSqlResponse
        :raises AccessDeniedException:
        :raises BadRequestException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        :raises ServiceUnavailableError:
        """
        raise NotImplementedError

    @handler("ExecuteStatement")
    def execute_statement(
        self,
        context: RequestContext,
        resource_arn: Arn,
        secret_arn: Arn,
        sql: SqlStatement,
        database: DbName = None,
        schema: DbName = None,
        parameters: SqlParametersList = None,
        transaction_id: Id = None,
        include_result_metadata: Boolean = None,
        continue_after_timeout: Boolean = None,
        result_set_options: ResultSetOptions = None,
        format_records_as: RecordsFormatType = None,
    ) -> ExecuteStatementResponse:
        """Runs a SQL statement against a database.

        If a call isn't part of a transaction because it doesn't include the
        ``transactionID`` parameter, changes that result from the call are
        committed automatically.

        If the binary response data from the database is more than 1 MB, the
        call is terminated.

        :param resource_arn: The Amazon Resource Name (ARN) of the Aurora Serverless DB cluster.
        :param secret_arn: The ARN of the secret that enables access to the DB cluster.
        :param sql: The SQL statement to run.
        :param database: The name of the database.
        :param schema: The name of the database schema.
        :param parameters: The parameters for the SQL statement.
        :param transaction_id: The identifier of a transaction that was started by using the
        ``BeginTransaction`` operation.
        :param include_result_metadata: A value that indicates whether to include metadata in the results.
        :param continue_after_timeout: A value that indicates whether to continue running the statement after
        the call times out.
        :param result_set_options: Options that control how the result set is returned.
        :param format_records_as: A value that indicates whether to format the result set as a single JSON
        string.
        :returns: ExecuteStatementResponse
        :raises AccessDeniedException:
        :raises BadRequestException:
        :raises StatementTimeoutException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        :raises ServiceUnavailableError:
        """
        raise NotImplementedError

    @handler("RollbackTransaction")
    def rollback_transaction(
        self, context: RequestContext, resource_arn: Arn, secret_arn: Arn, transaction_id: Id
    ) -> RollbackTransactionResponse:
        """Performs a rollback of a transaction. Rolling back a transaction cancels
        its changes.

        :param resource_arn: The Amazon Resource Name (ARN) of the Aurora Serverless DB cluster.
        :param secret_arn: The name or ARN of the secret that enables access to the DB cluster.
        :param transaction_id: The identifier of the transaction to roll back.
        :returns: RollbackTransactionResponse
        :raises AccessDeniedException:
        :raises BadRequestException:
        :raises StatementTimeoutException:
        :raises InternalServerErrorException:
        :raises ForbiddenException:
        :raises ServiceUnavailableError:
        :raises NotFoundException:
        """
        raise NotImplementedError
