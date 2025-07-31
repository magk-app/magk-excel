from datetime import datetime
from typing import List, Optional, TypedDict

from localstack.aws.api import RequestContext, ServiceException, ServiceRequest, handler

Boolean = bool
BoxedBoolean = bool
BoxedDouble = float
ClientToken = str
Integer = int
ListStatementsLimit = int
Location = str
PageSize = int
ParameterName = str
ParameterValue = str
SecretArn = str
StatementId = str
StatementNameString = str
StatementString = str
String = str
WorkgroupNameString = str
bool = bool


class StatementStatusString(str):
    SUBMITTED = "SUBMITTED"
    PICKED = "PICKED"
    STARTED = "STARTED"
    FINISHED = "FINISHED"
    ABORTED = "ABORTED"
    FAILED = "FAILED"


class StatusString(str):
    SUBMITTED = "SUBMITTED"
    PICKED = "PICKED"
    STARTED = "STARTED"
    FINISHED = "FINISHED"
    ABORTED = "ABORTED"
    FAILED = "FAILED"
    ALL = "ALL"


class ActiveStatementsExceededException(ServiceException):
    """The number of active statements exceeds the limit."""

    code: str = "ActiveStatementsExceededException"
    sender_fault: bool = False
    status_code: int = 400


class BatchExecuteStatementException(ServiceException):
    """An SQL statement encountered an environmental error while running."""

    code: str = "BatchExecuteStatementException"
    sender_fault: bool = False
    status_code: int = 400
    StatementId: String


class DatabaseConnectionException(ServiceException):
    """Connection to a database failed."""

    code: str = "DatabaseConnectionException"
    sender_fault: bool = False
    status_code: int = 400


class ExecuteStatementException(ServiceException):
    """The SQL statement encountered an environmental error while running."""

    code: str = "ExecuteStatementException"
    sender_fault: bool = False
    status_code: int = 400
    StatementId: String


class InternalServerException(ServiceException):
    """The Amazon Redshift Data API operation failed due to invalid input."""

    code: str = "InternalServerException"
    sender_fault: bool = False
    status_code: int = 400


class ResourceNotFoundException(ServiceException):
    """The Amazon Redshift Data API operation failed due to a missing resource."""

    code: str = "ResourceNotFoundException"
    sender_fault: bool = False
    status_code: int = 400
    ResourceId: String


class ValidationException(ServiceException):
    """The Amazon Redshift Data API operation failed due to invalid input."""

    code: str = "ValidationException"
    sender_fault: bool = False
    status_code: int = 400


SqlList = List[StatementString]


class BatchExecuteStatementInput(ServiceRequest):
    ClientToken: Optional[ClientToken]
    ClusterIdentifier: Optional[Location]
    Database: String
    DbUser: Optional[String]
    SecretArn: Optional[SecretArn]
    Sqls: SqlList
    StatementName: Optional[StatementNameString]
    WithEvent: Optional[Boolean]
    WorkgroupName: Optional[WorkgroupNameString]


Timestamp = datetime


class BatchExecuteStatementOutput(TypedDict, total=False):
    ClusterIdentifier: Optional[Location]
    CreatedAt: Optional[Timestamp]
    Database: Optional[String]
    DbUser: Optional[String]
    Id: Optional[StatementId]
    SecretArn: Optional[SecretArn]
    WorkgroupName: Optional[WorkgroupNameString]


Blob = bytes
BoxedLong = int


class CancelStatementRequest(ServiceRequest):
    Id: StatementId


class CancelStatementResponse(TypedDict, total=False):
    Status: Optional[Boolean]


class ColumnMetadata(TypedDict, total=False):
    """The properties (metadata) of a column."""

    columnDefault: Optional[String]
    isCaseSensitive: Optional[bool]
    isCurrency: Optional[bool]
    isSigned: Optional[bool]
    label: Optional[String]
    length: Optional[Integer]
    name: Optional[String]
    nullable: Optional[Integer]
    precision: Optional[Integer]
    scale: Optional[Integer]
    schemaName: Optional[String]
    tableName: Optional[String]
    typeName: Optional[String]


ColumnList = List[ColumnMetadata]
ColumnMetadataList = List[ColumnMetadata]
DatabaseList = List[String]


class DescribeStatementRequest(ServiceRequest):
    Id: StatementId


Long = int


class SubStatementData(TypedDict, total=False):
    """Information about an SQL statement."""

    CreatedAt: Optional[Timestamp]
    Duration: Optional[Long]
    Error: Optional[String]
    HasResultSet: Optional[Boolean]
    Id: StatementId
    QueryString: Optional[StatementString]
    RedshiftQueryId: Optional[Long]
    ResultRows: Optional[Long]
    ResultSize: Optional[Long]
    Status: Optional[StatementStatusString]
    UpdatedAt: Optional[Timestamp]


SubStatementList = List[SubStatementData]


class SqlParameter(TypedDict, total=False):
    """A parameter used in a SQL statement."""

    name: ParameterName
    value: ParameterValue


SqlParametersList = List[SqlParameter]


class DescribeStatementResponse(TypedDict, total=False):
    ClusterIdentifier: Optional[String]
    CreatedAt: Optional[Timestamp]
    Database: Optional[String]
    DbUser: Optional[String]
    Duration: Optional[Long]
    Error: Optional[String]
    HasResultSet: Optional[Boolean]
    Id: StatementId
    QueryParameters: Optional[SqlParametersList]
    QueryString: Optional[StatementString]
    RedshiftPid: Optional[Long]
    RedshiftQueryId: Optional[Long]
    ResultRows: Optional[Long]
    ResultSize: Optional[Long]
    SecretArn: Optional[SecretArn]
    Status: Optional[StatusString]
    SubStatements: Optional[SubStatementList]
    UpdatedAt: Optional[Timestamp]
    WorkgroupName: Optional[WorkgroupNameString]


class DescribeTableRequest(ServiceRequest):
    ClusterIdentifier: Optional[Location]
    ConnectedDatabase: Optional[String]
    Database: String
    DbUser: Optional[String]
    MaxResults: Optional[PageSize]
    NextToken: Optional[String]
    Schema: Optional[String]
    SecretArn: Optional[SecretArn]
    Table: Optional[String]
    WorkgroupName: Optional[WorkgroupNameString]


class DescribeTableResponse(TypedDict, total=False):
    ColumnList: Optional[ColumnList]
    NextToken: Optional[String]
    TableName: Optional[String]


class ExecuteStatementInput(ServiceRequest):
    ClientToken: Optional[ClientToken]
    ClusterIdentifier: Optional[Location]
    Database: String
    DbUser: Optional[String]
    Parameters: Optional[SqlParametersList]
    SecretArn: Optional[SecretArn]
    Sql: StatementString
    StatementName: Optional[StatementNameString]
    WithEvent: Optional[Boolean]
    WorkgroupName: Optional[WorkgroupNameString]


class ExecuteStatementOutput(TypedDict, total=False):
    ClusterIdentifier: Optional[Location]
    CreatedAt: Optional[Timestamp]
    Database: Optional[String]
    DbUser: Optional[String]
    Id: Optional[StatementId]
    SecretArn: Optional[SecretArn]
    WorkgroupName: Optional[WorkgroupNameString]


class Field(TypedDict, total=False):
    """A data value in a column."""

    blobValue: Optional[Blob]
    booleanValue: Optional[BoxedBoolean]
    doubleValue: Optional[BoxedDouble]
    isNull: Optional[BoxedBoolean]
    longValue: Optional[BoxedLong]
    stringValue: Optional[String]


FieldList = List[Field]


class GetStatementResultRequest(ServiceRequest):
    Id: StatementId
    NextToken: Optional[String]


SqlRecords = List[FieldList]


class GetStatementResultResponse(TypedDict, total=False):
    ColumnMetadata: Optional[ColumnMetadataList]
    NextToken: Optional[String]
    Records: SqlRecords
    TotalNumRows: Optional[Long]


class ListDatabasesRequest(ServiceRequest):
    ClusterIdentifier: Optional[Location]
    Database: String
    DbUser: Optional[String]
    MaxResults: Optional[PageSize]
    NextToken: Optional[String]
    SecretArn: Optional[SecretArn]
    WorkgroupName: Optional[WorkgroupNameString]


class ListDatabasesResponse(TypedDict, total=False):
    Databases: Optional[DatabaseList]
    NextToken: Optional[String]


class ListSchemasRequest(ServiceRequest):
    ClusterIdentifier: Optional[Location]
    ConnectedDatabase: Optional[String]
    Database: String
    DbUser: Optional[String]
    MaxResults: Optional[PageSize]
    NextToken: Optional[String]
    SchemaPattern: Optional[String]
    SecretArn: Optional[SecretArn]
    WorkgroupName: Optional[WorkgroupNameString]


SchemaList = List[String]


class ListSchemasResponse(TypedDict, total=False):
    NextToken: Optional[String]
    Schemas: Optional[SchemaList]


class ListStatementsRequest(ServiceRequest):
    MaxResults: Optional[ListStatementsLimit]
    NextToken: Optional[String]
    RoleLevel: Optional[Boolean]
    StatementName: Optional[StatementNameString]
    Status: Optional[StatusString]


StatementStringList = List[StatementString]


class StatementData(TypedDict, total=False):
    """The SQL statement to run."""

    CreatedAt: Optional[Timestamp]
    Id: StatementId
    IsBatchStatement: Optional[Boolean]
    QueryParameters: Optional[SqlParametersList]
    QueryString: Optional[StatementString]
    QueryStrings: Optional[StatementStringList]
    SecretArn: Optional[SecretArn]
    StatementName: Optional[StatementNameString]
    Status: Optional[StatusString]
    UpdatedAt: Optional[Timestamp]


StatementList = List[StatementData]


class ListStatementsResponse(TypedDict, total=False):
    NextToken: Optional[String]
    Statements: StatementList


class ListTablesRequest(ServiceRequest):
    ClusterIdentifier: Optional[Location]
    ConnectedDatabase: Optional[String]
    Database: String
    DbUser: Optional[String]
    MaxResults: Optional[PageSize]
    NextToken: Optional[String]
    SchemaPattern: Optional[String]
    SecretArn: Optional[SecretArn]
    TablePattern: Optional[String]
    WorkgroupName: Optional[WorkgroupNameString]


TableMember = TypedDict(
    "TableMember",
    {
        "name": Optional[String],
        "schema": Optional[String],
        "type": Optional[String],
    },
    total=False,
)
TableList = List[TableMember]


class ListTablesResponse(TypedDict, total=False):
    NextToken: Optional[String]
    Tables: Optional[TableList]


class RedshiftDataApi:
    service = "redshift-data"
    version = "2019-12-20"

    @handler("BatchExecuteStatement")
    def batch_execute_statement(
        self,
        context: RequestContext,
        database: String,
        sqls: SqlList,
        client_token: ClientToken = None,
        cluster_identifier: Location = None,
        db_user: String = None,
        secret_arn: SecretArn = None,
        statement_name: StatementNameString = None,
        with_event: Boolean = None,
        workgroup_name: WorkgroupNameString = None,
    ) -> BatchExecuteStatementOutput:
        """Runs one or more SQL statements, which can be data manipulation language
        (DML) or data definition language (DDL). Depending on the authorization
        method, use one of the following combinations of request parameters:

        -  Secrets Manager - when connecting to a cluster, provide the
           ``secret-arn`` of a secret stored in Secrets Manager which has
           ``username`` and ``password``. The specified secret contains
           credentials to connect to the ``database`` you specify. When you are
           connecting to a cluster, you also supply the database name, If you
           provide a cluster identifier (``dbClusterIdentifier``), it must match
           the cluster identifier stored in the secret. When you are connecting
           to a serverless workgroup, you also supply the database name.

        -  Temporary credentials - when connecting to your data warehouse,
           choose one of the following options:

           -  When connecting to a serverless workgroup, specify the workgroup
              name and database name. The database user name is derived from the
              IAM identity. For example, ``arn:iam::123456789012:user:foo`` has
              the database user name ``IAM:foo``. Also, permission to call the
              ``redshift-serverless:GetCredentials`` operation is required.

           -  When connecting to a cluster as an IAM identity, specify the
              cluster identifier and the database name. The database user name
              is derived from the IAM identity. For example,
              ``arn:iam::123456789012:user:foo`` has the database user name
              ``IAM:foo``. Also, permission to call the
              ``redshift:GetClusterCredentialsWithIAM`` operation is required.

           -  When connecting to a cluster as a database user, specify the
              cluster identifier, the database name, and the database user name.
              Also, permission to call the ``redshift:GetClusterCredentials``
              operation is required.

        For more information about the Amazon Redshift Data API and CLI usage
        examples, see `Using the Amazon Redshift Data
        API <https://docs.aws.amazon.com/redshift/latest/mgmt/data-api.html>`__
        in the *Amazon Redshift Management Guide*.

        :param database: The name of the database.
        :param sqls: One or more SQL statements to run.
        :param client_token: A unique, case-sensitive identifier that you provide to ensure the
        idempotency of the request.
        :param cluster_identifier: The cluster identifier.
        :param db_user: The database user name.
        :param secret_arn: The name or ARN of the secret that enables access to the database.
        :param statement_name: The name of the SQL statements.
        :param with_event: A value that indicates whether to send an event to the Amazon
        EventBridge event bus after the SQL statements run.
        :param workgroup_name: The serverless workgroup name or Amazon Resource Name (ARN).
        :returns: BatchExecuteStatementOutput
        :raises ValidationException:
        :raises ActiveStatementsExceededException:
        :raises BatchExecuteStatementException:
        """
        raise NotImplementedError

    @handler("CancelStatement")
    def cancel_statement(self, context: RequestContext, id: StatementId) -> CancelStatementResponse:
        """Cancels a running query. To be canceled, a query must be running.

        For more information about the Amazon Redshift Data API and CLI usage
        examples, see `Using the Amazon Redshift Data
        API <https://docs.aws.amazon.com/redshift/latest/mgmt/data-api.html>`__
        in the *Amazon Redshift Management Guide*.

        :param id: The identifier of the SQL statement to cancel.
        :returns: CancelStatementResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises DatabaseConnectionException:
        """
        raise NotImplementedError

    @handler("DescribeStatement")
    def describe_statement(
        self, context: RequestContext, id: StatementId
    ) -> DescribeStatementResponse:
        """Describes the details about a specific instance when a query was run by
        the Amazon Redshift Data API. The information includes when the query
        started, when it finished, the query status, the number of rows
        returned, and the SQL statement.

        For more information about the Amazon Redshift Data API and CLI usage
        examples, see `Using the Amazon Redshift Data
        API <https://docs.aws.amazon.com/redshift/latest/mgmt/data-api.html>`__
        in the *Amazon Redshift Management Guide*.

        :param id: The identifier of the SQL statement to describe.
        :returns: DescribeStatementResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("DescribeTable")
    def describe_table(
        self,
        context: RequestContext,
        database: String,
        cluster_identifier: Location = None,
        connected_database: String = None,
        db_user: String = None,
        max_results: PageSize = None,
        next_token: String = None,
        schema: String = None,
        secret_arn: SecretArn = None,
        table: String = None,
        workgroup_name: WorkgroupNameString = None,
    ) -> DescribeTableResponse:
        """Describes the detailed information about a table from metadata in the
        cluster. The information includes its columns. A token is returned to
        page through the column list. Depending on the authorization method, use
        one of the following combinations of request parameters:

        -  Secrets Manager - when connecting to a cluster, provide the
           ``secret-arn`` of a secret stored in Secrets Manager which has
           ``username`` and ``password``. The specified secret contains
           credentials to connect to the ``database`` you specify. When you are
           connecting to a cluster, you also supply the database name, If you
           provide a cluster identifier (``dbClusterIdentifier``), it must match
           the cluster identifier stored in the secret. When you are connecting
           to a serverless workgroup, you also supply the database name.

        -  Temporary credentials - when connecting to your data warehouse,
           choose one of the following options:

           -  When connecting to a serverless workgroup, specify the workgroup
              name and database name. The database user name is derived from the
              IAM identity. For example, ``arn:iam::123456789012:user:foo`` has
              the database user name ``IAM:foo``. Also, permission to call the
              ``redshift-serverless:GetCredentials`` operation is required.

           -  When connecting to a cluster as an IAM identity, specify the
              cluster identifier and the database name. The database user name
              is derived from the IAM identity. For example,
              ``arn:iam::123456789012:user:foo`` has the database user name
              ``IAM:foo``. Also, permission to call the
              ``redshift:GetClusterCredentialsWithIAM`` operation is required.

           -  When connecting to a cluster as a database user, specify the
              cluster identifier, the database name, and the database user name.
              Also, permission to call the ``redshift:GetClusterCredentials``
              operation is required.

        For more information about the Amazon Redshift Data API and CLI usage
        examples, see `Using the Amazon Redshift Data
        API <https://docs.aws.amazon.com/redshift/latest/mgmt/data-api.html>`__
        in the *Amazon Redshift Management Guide*.

        :param database: The name of the database that contains the tables to be described.
        :param cluster_identifier: The cluster identifier.
        :param connected_database: A database name.
        :param db_user: The database user name.
        :param max_results: The maximum number of tables to return in the response.
        :param next_token: A value that indicates the starting point for the next set of response
        records in a subsequent request.
        :param schema: The schema that contains the table.
        :param secret_arn: The name or ARN of the secret that enables access to the database.
        :param table: The table name.
        :param workgroup_name: The serverless workgroup name or Amazon Resource Name (ARN).
        :returns: DescribeTableResponse
        :raises ValidationException:
        :raises InternalServerException:
        :raises DatabaseConnectionException:
        """
        raise NotImplementedError

    @handler("ExecuteStatement")
    def execute_statement(
        self,
        context: RequestContext,
        database: String,
        sql: StatementString,
        client_token: ClientToken = None,
        cluster_identifier: Location = None,
        db_user: String = None,
        parameters: SqlParametersList = None,
        secret_arn: SecretArn = None,
        statement_name: StatementNameString = None,
        with_event: Boolean = None,
        workgroup_name: WorkgroupNameString = None,
    ) -> ExecuteStatementOutput:
        """Runs an SQL statement, which can be data manipulation language (DML) or
        data definition language (DDL). This statement must be a single SQL
        statement. Depending on the authorization method, use one of the
        following combinations of request parameters:

        -  Secrets Manager - when connecting to a cluster, provide the
           ``secret-arn`` of a secret stored in Secrets Manager which has
           ``username`` and ``password``. The specified secret contains
           credentials to connect to the ``database`` you specify. When you are
           connecting to a cluster, you also supply the database name, If you
           provide a cluster identifier (``dbClusterIdentifier``), it must match
           the cluster identifier stored in the secret. When you are connecting
           to a serverless workgroup, you also supply the database name.

        -  Temporary credentials - when connecting to your data warehouse,
           choose one of the following options:

           -  When connecting to a serverless workgroup, specify the workgroup
              name and database name. The database user name is derived from the
              IAM identity. For example, ``arn:iam::123456789012:user:foo`` has
              the database user name ``IAM:foo``. Also, permission to call the
              ``redshift-serverless:GetCredentials`` operation is required.

           -  When connecting to a cluster as an IAM identity, specify the
              cluster identifier and the database name. The database user name
              is derived from the IAM identity. For example,
              ``arn:iam::123456789012:user:foo`` has the database user name
              ``IAM:foo``. Also, permission to call the
              ``redshift:GetClusterCredentialsWithIAM`` operation is required.

           -  When connecting to a cluster as a database user, specify the
              cluster identifier, the database name, and the database user name.
              Also, permission to call the ``redshift:GetClusterCredentials``
              operation is required.

        For more information about the Amazon Redshift Data API and CLI usage
        examples, see `Using the Amazon Redshift Data
        API <https://docs.aws.amazon.com/redshift/latest/mgmt/data-api.html>`__
        in the *Amazon Redshift Management Guide*.

        :param database: The name of the database.
        :param sql: The SQL statement text to run.
        :param client_token: A unique, case-sensitive identifier that you provide to ensure the
        idempotency of the request.
        :param cluster_identifier: The cluster identifier.
        :param db_user: The database user name.
        :param parameters: The parameters for the SQL statement.
        :param secret_arn: The name or ARN of the secret that enables access to the database.
        :param statement_name: The name of the SQL statement.
        :param with_event: A value that indicates whether to send an event to the Amazon
        EventBridge event bus after the SQL statement runs.
        :param workgroup_name: The serverless workgroup name or Amazon Resource Name (ARN).
        :returns: ExecuteStatementOutput
        :raises ValidationException:
        :raises ExecuteStatementException:
        :raises ActiveStatementsExceededException:
        """
        raise NotImplementedError

    @handler("GetStatementResult")
    def get_statement_result(
        self, context: RequestContext, id: StatementId, next_token: String = None
    ) -> GetStatementResultResponse:
        """Fetches the temporarily cached result of an SQL statement. A token is
        returned to page through the statement results.

        For more information about the Amazon Redshift Data API and CLI usage
        examples, see `Using the Amazon Redshift Data
        API <https://docs.aws.amazon.com/redshift/latest/mgmt/data-api.html>`__
        in the *Amazon Redshift Management Guide*.

        :param id: The identifier of the SQL statement whose results are to be fetched.
        :param next_token: A value that indicates the starting point for the next set of response
        records in a subsequent request.
        :returns: GetStatementResultResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("ListDatabases")
    def list_databases(
        self,
        context: RequestContext,
        database: String,
        cluster_identifier: Location = None,
        db_user: String = None,
        max_results: PageSize = None,
        next_token: String = None,
        secret_arn: SecretArn = None,
        workgroup_name: WorkgroupNameString = None,
    ) -> ListDatabasesResponse:
        """List the databases in a cluster. A token is returned to page through the
        database list. Depending on the authorization method, use one of the
        following combinations of request parameters:

        -  Secrets Manager - when connecting to a cluster, provide the
           ``secret-arn`` of a secret stored in Secrets Manager which has
           ``username`` and ``password``. The specified secret contains
           credentials to connect to the ``database`` you specify. When you are
           connecting to a cluster, you also supply the database name, If you
           provide a cluster identifier (``dbClusterIdentifier``), it must match
           the cluster identifier stored in the secret. When you are connecting
           to a serverless workgroup, you also supply the database name.

        -  Temporary credentials - when connecting to your data warehouse,
           choose one of the following options:

           -  When connecting to a serverless workgroup, specify the workgroup
              name and database name. The database user name is derived from the
              IAM identity. For example, ``arn:iam::123456789012:user:foo`` has
              the database user name ``IAM:foo``. Also, permission to call the
              ``redshift-serverless:GetCredentials`` operation is required.

           -  When connecting to a cluster as an IAM identity, specify the
              cluster identifier and the database name. The database user name
              is derived from the IAM identity. For example,
              ``arn:iam::123456789012:user:foo`` has the database user name
              ``IAM:foo``. Also, permission to call the
              ``redshift:GetClusterCredentialsWithIAM`` operation is required.

           -  When connecting to a cluster as a database user, specify the
              cluster identifier, the database name, and the database user name.
              Also, permission to call the ``redshift:GetClusterCredentials``
              operation is required.

        For more information about the Amazon Redshift Data API and CLI usage
        examples, see `Using the Amazon Redshift Data
        API <https://docs.aws.amazon.com/redshift/latest/mgmt/data-api.html>`__
        in the *Amazon Redshift Management Guide*.

        :param database: The name of the database.
        :param cluster_identifier: The cluster identifier.
        :param db_user: The database user name.
        :param max_results: The maximum number of databases to return in the response.
        :param next_token: A value that indicates the starting point for the next set of response
        records in a subsequent request.
        :param secret_arn: The name or ARN of the secret that enables access to the database.
        :param workgroup_name: The serverless workgroup name or Amazon Resource Name (ARN).
        :returns: ListDatabasesResponse
        :raises ValidationException:
        :raises InternalServerException:
        :raises DatabaseConnectionException:
        """
        raise NotImplementedError

    @handler("ListSchemas")
    def list_schemas(
        self,
        context: RequestContext,
        database: String,
        cluster_identifier: Location = None,
        connected_database: String = None,
        db_user: String = None,
        max_results: PageSize = None,
        next_token: String = None,
        schema_pattern: String = None,
        secret_arn: SecretArn = None,
        workgroup_name: WorkgroupNameString = None,
    ) -> ListSchemasResponse:
        """Lists the schemas in a database. A token is returned to page through the
        schema list. Depending on the authorization method, use one of the
        following combinations of request parameters:

        -  Secrets Manager - when connecting to a cluster, provide the
           ``secret-arn`` of a secret stored in Secrets Manager which has
           ``username`` and ``password``. The specified secret contains
           credentials to connect to the ``database`` you specify. When you are
           connecting to a cluster, you also supply the database name, If you
           provide a cluster identifier (``dbClusterIdentifier``), it must match
           the cluster identifier stored in the secret. When you are connecting
           to a serverless workgroup, you also supply the database name.

        -  Temporary credentials - when connecting to your data warehouse,
           choose one of the following options:

           -  When connecting to a serverless workgroup, specify the workgroup
              name and database name. The database user name is derived from the
              IAM identity. For example, ``arn:iam::123456789012:user:foo`` has
              the database user name ``IAM:foo``. Also, permission to call the
              ``redshift-serverless:GetCredentials`` operation is required.

           -  When connecting to a cluster as an IAM identity, specify the
              cluster identifier and the database name. The database user name
              is derived from the IAM identity. For example,
              ``arn:iam::123456789012:user:foo`` has the database user name
              ``IAM:foo``. Also, permission to call the
              ``redshift:GetClusterCredentialsWithIAM`` operation is required.

           -  When connecting to a cluster as a database user, specify the
              cluster identifier, the database name, and the database user name.
              Also, permission to call the ``redshift:GetClusterCredentials``
              operation is required.

        For more information about the Amazon Redshift Data API and CLI usage
        examples, see `Using the Amazon Redshift Data
        API <https://docs.aws.amazon.com/redshift/latest/mgmt/data-api.html>`__
        in the *Amazon Redshift Management Guide*.

        :param database: The name of the database that contains the schemas to list.
        :param cluster_identifier: The cluster identifier.
        :param connected_database: A database name.
        :param db_user: The database user name.
        :param max_results: The maximum number of schemas to return in the response.
        :param next_token: A value that indicates the starting point for the next set of response
        records in a subsequent request.
        :param schema_pattern: A pattern to filter results by schema name.
        :param secret_arn: The name or ARN of the secret that enables access to the database.
        :param workgroup_name: The serverless workgroup name or Amazon Resource Name (ARN).
        :returns: ListSchemasResponse
        :raises ValidationException:
        :raises InternalServerException:
        :raises DatabaseConnectionException:
        """
        raise NotImplementedError

    @handler("ListStatements")
    def list_statements(
        self,
        context: RequestContext,
        max_results: ListStatementsLimit = None,
        next_token: String = None,
        role_level: Boolean = None,
        statement_name: StatementNameString = None,
        status: StatusString = None,
    ) -> ListStatementsResponse:
        """List of SQL statements. By default, only finished statements are shown.
        A token is returned to page through the statement list.

        For more information about the Amazon Redshift Data API and CLI usage
        examples, see `Using the Amazon Redshift Data
        API <https://docs.aws.amazon.com/redshift/latest/mgmt/data-api.html>`__
        in the *Amazon Redshift Management Guide*.

        :param max_results: The maximum number of SQL statements to return in the response.
        :param next_token: A value that indicates the starting point for the next set of response
        records in a subsequent request.
        :param role_level: A value that filters which statements to return in the response.
        :param statement_name: The name of the SQL statement specified as input to
        ``BatchExecuteStatement`` or ``ExecuteStatement`` to identify the query.
        :param status: The status of the SQL statement to list.
        :returns: ListStatementsResponse
        :raises ValidationException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("ListTables")
    def list_tables(
        self,
        context: RequestContext,
        database: String,
        cluster_identifier: Location = None,
        connected_database: String = None,
        db_user: String = None,
        max_results: PageSize = None,
        next_token: String = None,
        schema_pattern: String = None,
        secret_arn: SecretArn = None,
        table_pattern: String = None,
        workgroup_name: WorkgroupNameString = None,
    ) -> ListTablesResponse:
        """List the tables in a database. If neither ``SchemaPattern`` nor
        ``TablePattern`` are specified, then all tables in the database are
        returned. A token is returned to page through the table list. Depending
        on the authorization method, use one of the following combinations of
        request parameters:

        -  Secrets Manager - when connecting to a cluster, provide the
           ``secret-arn`` of a secret stored in Secrets Manager which has
           ``username`` and ``password``. The specified secret contains
           credentials to connect to the ``database`` you specify. When you are
           connecting to a cluster, you also supply the database name, If you
           provide a cluster identifier (``dbClusterIdentifier``), it must match
           the cluster identifier stored in the secret. When you are connecting
           to a serverless workgroup, you also supply the database name.

        -  Temporary credentials - when connecting to your data warehouse,
           choose one of the following options:

           -  When connecting to a serverless workgroup, specify the workgroup
              name and database name. The database user name is derived from the
              IAM identity. For example, ``arn:iam::123456789012:user:foo`` has
              the database user name ``IAM:foo``. Also, permission to call the
              ``redshift-serverless:GetCredentials`` operation is required.

           -  When connecting to a cluster as an IAM identity, specify the
              cluster identifier and the database name. The database user name
              is derived from the IAM identity. For example,
              ``arn:iam::123456789012:user:foo`` has the database user name
              ``IAM:foo``. Also, permission to call the
              ``redshift:GetClusterCredentialsWithIAM`` operation is required.

           -  When connecting to a cluster as a database user, specify the
              cluster identifier, the database name, and the database user name.
              Also, permission to call the ``redshift:GetClusterCredentials``
              operation is required.

        For more information about the Amazon Redshift Data API and CLI usage
        examples, see `Using the Amazon Redshift Data
        API <https://docs.aws.amazon.com/redshift/latest/mgmt/data-api.html>`__
        in the *Amazon Redshift Management Guide*.

        :param database: The name of the database that contains the tables to list.
        :param cluster_identifier: The cluster identifier.
        :param connected_database: A database name.
        :param db_user: The database user name.
        :param max_results: The maximum number of tables to return in the response.
        :param next_token: A value that indicates the starting point for the next set of response
        records in a subsequent request.
        :param schema_pattern: A pattern to filter results by schema name.
        :param secret_arn: The name or ARN of the secret that enables access to the database.
        :param table_pattern: A pattern to filter results by table name.
        :param workgroup_name: The serverless workgroup name or Amazon Resource Name (ARN).
        :returns: ListTablesResponse
        :raises ValidationException:
        :raises InternalServerException:
        :raises DatabaseConnectionException:
        """
        raise NotImplementedError
