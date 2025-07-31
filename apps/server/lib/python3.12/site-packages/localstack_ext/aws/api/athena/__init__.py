from datetime import datetime
from typing import Dict, List, Optional, TypedDict

from localstack.aws.api import RequestContext, ServiceException, ServiceRequest, handler

Age = int
AllocatedDpusInteger = int
AmazonResourceName = str
AuthToken = str
AwsAccountId = str
Boolean = bool
BoxedBoolean = bool
CalculationExecutionId = str
CalculationResultType = str
CapacityReservationName = str
CatalogNameString = str
ClientRequestToken = str
CodeBlock = str
CommentString = str
CoordinatorDpuSize = int
DatabaseString = str
DefaultExecutorDpuSize = int
DescriptionString = str
ErrorCategory = int
ErrorCode = str
ErrorMessage = str
ErrorType = int
ExecutionParameter = str
ExecutorId = str
ExpressionString = str
IdempotencyToken = str
Integer = int
KeyString = str
KmsKey = str
MaxApplicationDPUSizesCount = int
MaxCalculationsCount = int
MaxCapacityReservationsCount = int
MaxConcurrentDpus = int
MaxDataCatalogsCount = int
MaxDatabasesCount = int
MaxEngineVersionsCount = int
MaxListExecutorsCount = int
MaxNamedQueriesCount = int
MaxNotebooksCount = int
MaxPreparedStatementsCount = int
MaxQueryExecutionsCount = int
MaxQueryResults = int
MaxSessionsCount = int
MaxTableMetadataCount = int
MaxTagsCount = int
MaxWorkGroupsCount = int
NameString = str
NamedQueryDescriptionString = str
NamedQueryId = str
NotebookId = str
NotebookName = str
ParametersMapValue = str
Payload = str
QueryExecutionId = str
QueryString = str
ResultOutputLocation = str
RoleArn = str
S3Uri = str
SessionId = str
SessionIdleTimeoutInMinutes = int
SessionManagerToken = str
StatementName = str
String = str
TableTypeString = str
TagKey = str
TagValue = str
TargetDpusInteger = int
Token = str
TypeString = str
WorkGroupDescriptionString = str
WorkGroupName = str
datumString = str


class CalculationExecutionState(str):
    CREATING = "CREATING"
    CREATED = "CREATED"
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    CANCELING = "CANCELING"
    CANCELED = "CANCELED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class CapacityAllocationStatus(str):
    PENDING = "PENDING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"


class CapacityReservationStatus(str):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    CANCELLING = "CANCELLING"
    CANCELLED = "CANCELLED"
    FAILED = "FAILED"
    UPDATE_PENDING = "UPDATE_PENDING"


class ColumnNullable(str):
    NOT_NULL = "NOT_NULL"
    NULLABLE = "NULLABLE"
    UNKNOWN = "UNKNOWN"


class DataCatalogType(str):
    LAMBDA = "LAMBDA"
    GLUE = "GLUE"
    HIVE = "HIVE"


class EncryptionOption(str):
    SSE_S3 = "SSE_S3"
    SSE_KMS = "SSE_KMS"
    CSE_KMS = "CSE_KMS"


class ExecutorState(str):
    CREATING = "CREATING"
    CREATED = "CREATED"
    REGISTERED = "REGISTERED"
    TERMINATING = "TERMINATING"
    TERMINATED = "TERMINATED"
    FAILED = "FAILED"


class ExecutorType(str):
    COORDINATOR = "COORDINATOR"
    GATEWAY = "GATEWAY"
    WORKER = "WORKER"


class NotebookType(str):
    IPYNB = "IPYNB"


class QueryExecutionState(str):
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class S3AclOption(str):
    BUCKET_OWNER_FULL_CONTROL = "BUCKET_OWNER_FULL_CONTROL"


class SessionState(str):
    CREATING = "CREATING"
    CREATED = "CREATED"
    IDLE = "IDLE"
    BUSY = "BUSY"
    TERMINATING = "TERMINATING"
    TERMINATED = "TERMINATED"
    DEGRADED = "DEGRADED"
    FAILED = "FAILED"


class StatementType(str):
    DDL = "DDL"
    DML = "DML"
    UTILITY = "UTILITY"


class ThrottleReason(str):
    CONCURRENT_QUERY_LIMIT_EXCEEDED = "CONCURRENT_QUERY_LIMIT_EXCEEDED"


class WorkGroupState(str):
    ENABLED = "ENABLED"
    DISABLED = "DISABLED"


class InternalServerException(ServiceException):
    """Indicates a platform issue, which may be due to a transient condition or
    outage.
    """

    code: str = "InternalServerException"
    sender_fault: bool = False
    status_code: int = 400


class InvalidRequestException(ServiceException):
    """Indicates that something is wrong with the input to the request. For
    example, a required parameter may be missing or out of range.
    """

    code: str = "InvalidRequestException"
    sender_fault: bool = False
    status_code: int = 400
    AthenaErrorCode: Optional[ErrorCode]


class MetadataException(ServiceException):
    """An exception that Athena received when it called a custom metastore.
    Occurs if the error is not caused by user input
    (``InvalidRequestException``) or from the Athena platform
    (``InternalServerException``). For example, if a user-created Lambda
    function is missing permissions, the Lambda ``4XX`` exception is
    returned in a ``MetadataException``.
    """

    code: str = "MetadataException"
    sender_fault: bool = False
    status_code: int = 400


class ResourceNotFoundException(ServiceException):
    """A resource, such as a workgroup, was not found."""

    code: str = "ResourceNotFoundException"
    sender_fault: bool = False
    status_code: int = 400
    ResourceName: Optional[AmazonResourceName]


class SessionAlreadyExistsException(ServiceException):
    """The specified session already exists."""

    code: str = "SessionAlreadyExistsException"
    sender_fault: bool = False
    status_code: int = 400


class TooManyRequestsException(ServiceException):
    """Indicates that the request was throttled."""

    code: str = "TooManyRequestsException"
    sender_fault: bool = False
    status_code: int = 400
    Reason: Optional[ThrottleReason]


class AclConfiguration(TypedDict, total=False):
    """Indicates that an Amazon S3 canned ACL should be set to control
    ownership of stored query results. When Athena stores query results in
    Amazon S3, the canned ACL is set with the ``x-amz-acl`` request header.
    For more information about S3 Object Ownership, see `Object Ownership
    settings <https://docs.aws.amazon.com/AmazonS3/latest/userguide/about-object-ownership.html#object-ownership-overview>`__
    in the *Amazon S3 User Guide*.
    """

    S3AclOption: S3AclOption


SupportedDPUSizeList = List[Integer]


class ApplicationDPUSizes(TypedDict, total=False):
    """Contains the application runtime IDs and their supported DPU sizes."""

    ApplicationRuntimeId: Optional[NameString]
    SupportedDPUSizes: Optional[SupportedDPUSizeList]


ApplicationDPUSizesList = List[ApplicationDPUSizes]


class AthenaError(TypedDict, total=False):
    """Provides information about an Athena query error. The ``AthenaError``
    feature provides standardized error information to help you understand
    failed queries and take steps after a query failure occurs.
    ``AthenaError`` includes an ``ErrorCategory`` field that specifies
    whether the cause of the failed query is due to system error, user
    error, or other error.
    """

    ErrorCategory: Optional[ErrorCategory]
    ErrorType: Optional[ErrorType]
    Retryable: Optional[Boolean]
    ErrorMessage: Optional[String]


NamedQueryIdList = List[NamedQueryId]


class BatchGetNamedQueryInput(ServiceRequest):
    """Contains an array of named query IDs."""

    NamedQueryIds: NamedQueryIdList


class UnprocessedNamedQueryId(TypedDict, total=False):
    """Information about a named query ID that could not be processed."""

    NamedQueryId: Optional[NamedQueryId]
    ErrorCode: Optional[ErrorCode]
    ErrorMessage: Optional[ErrorMessage]


UnprocessedNamedQueryIdList = List[UnprocessedNamedQueryId]


class NamedQuery(TypedDict, total=False):
    """A query, where ``QueryString`` contains the SQL statements that make up
    the query.
    """

    Name: NameString
    Description: Optional[DescriptionString]
    Database: DatabaseString
    QueryString: QueryString
    NamedQueryId: Optional[NamedQueryId]
    WorkGroup: Optional[WorkGroupName]


NamedQueryList = List[NamedQuery]


class BatchGetNamedQueryOutput(TypedDict, total=False):
    NamedQueries: Optional[NamedQueryList]
    UnprocessedNamedQueryIds: Optional[UnprocessedNamedQueryIdList]


PreparedStatementNameList = List[StatementName]


class BatchGetPreparedStatementInput(ServiceRequest):
    PreparedStatementNames: PreparedStatementNameList
    WorkGroup: WorkGroupName


class UnprocessedPreparedStatementName(TypedDict, total=False):
    """The name of a prepared statement that could not be returned."""

    StatementName: Optional[StatementName]
    ErrorCode: Optional[ErrorCode]
    ErrorMessage: Optional[ErrorMessage]


UnprocessedPreparedStatementNameList = List[UnprocessedPreparedStatementName]
Date = datetime


class PreparedStatement(TypedDict, total=False):
    """A prepared SQL statement for use with Athena."""

    StatementName: Optional[StatementName]
    QueryStatement: Optional[QueryString]
    WorkGroupName: Optional[WorkGroupName]
    Description: Optional[DescriptionString]
    LastModifiedTime: Optional[Date]


PreparedStatementDetailsList = List[PreparedStatement]


class BatchGetPreparedStatementOutput(TypedDict, total=False):
    PreparedStatements: Optional[PreparedStatementDetailsList]
    UnprocessedPreparedStatementNames: Optional[UnprocessedPreparedStatementNameList]


QueryExecutionIdList = List[QueryExecutionId]


class BatchGetQueryExecutionInput(ServiceRequest):
    """Contains an array of query execution IDs."""

    QueryExecutionIds: QueryExecutionIdList


class UnprocessedQueryExecutionId(TypedDict, total=False):
    """Describes a query execution that failed to process."""

    QueryExecutionId: Optional[QueryExecutionId]
    ErrorCode: Optional[ErrorCode]
    ErrorMessage: Optional[ErrorMessage]


UnprocessedQueryExecutionIdList = List[UnprocessedQueryExecutionId]
ExecutionParameters = List[ExecutionParameter]


class EngineVersion(TypedDict, total=False):
    """The Athena engine version for running queries, or the PySpark engine
    version for running sessions.
    """

    SelectedEngineVersion: Optional[NameString]
    EffectiveEngineVersion: Optional[NameString]


class ResultReuseInformation(TypedDict, total=False):
    """Contains information about whether the result of a previous query was
    reused.
    """

    ReusedPreviousResult: Boolean


Long = int


class QueryExecutionStatistics(TypedDict, total=False):
    """The amount of data scanned during the query execution and the amount of
    time that it took to execute, and the type of statement that was run.
    """

    EngineExecutionTimeInMillis: Optional[Long]
    DataScannedInBytes: Optional[Long]
    DataManifestLocation: Optional[String]
    TotalExecutionTimeInMillis: Optional[Long]
    QueryQueueTimeInMillis: Optional[Long]
    QueryPlanningTimeInMillis: Optional[Long]
    ServiceProcessingTimeInMillis: Optional[Long]
    ResultReuseInformation: Optional[ResultReuseInformation]


class QueryExecutionStatus(TypedDict, total=False):
    """The completion date, current state, submission time, and state change
    reason (if applicable) for the query execution.
    """

    State: Optional[QueryExecutionState]
    StateChangeReason: Optional[String]
    SubmissionDateTime: Optional[Date]
    CompletionDateTime: Optional[Date]
    AthenaError: Optional[AthenaError]


class QueryExecutionContext(TypedDict, total=False):
    """The database and data catalog context in which the query execution
    occurs.
    """

    Database: Optional[DatabaseString]
    Catalog: Optional[CatalogNameString]


class ResultReuseByAgeConfiguration(TypedDict, total=False):
    """Specifies whether previous query results are reused, and if so, their
    maximum age.
    """

    Enabled: Boolean
    MaxAgeInMinutes: Optional[Age]


class ResultReuseConfiguration(TypedDict, total=False):
    """Specifies the query result reuse behavior for the query."""

    ResultReuseByAgeConfiguration: Optional[ResultReuseByAgeConfiguration]


class EncryptionConfiguration(TypedDict, total=False):
    """If query and calculation results are encrypted in Amazon S3, indicates
    the encryption option used (for example, ``SSE_KMS`` or ``CSE_KMS``) and
    key information.
    """

    EncryptionOption: EncryptionOption
    KmsKey: Optional[String]


class ResultConfiguration(TypedDict, total=False):
    """The location in Amazon S3 where query and calculation results are stored
    and the encryption option, if any, used for query and calculation
    results. These are known as "client-side settings". If workgroup
    settings override client-side settings, then the query uses the
    workgroup settings.
    """

    OutputLocation: Optional[ResultOutputLocation]
    EncryptionConfiguration: Optional[EncryptionConfiguration]
    ExpectedBucketOwner: Optional[AwsAccountId]
    AclConfiguration: Optional[AclConfiguration]


class QueryExecution(TypedDict, total=False):
    """Information about a single instance of a query execution."""

    QueryExecutionId: Optional[QueryExecutionId]
    Query: Optional[QueryString]
    StatementType: Optional[StatementType]
    ResultConfiguration: Optional[ResultConfiguration]
    ResultReuseConfiguration: Optional[ResultReuseConfiguration]
    QueryExecutionContext: Optional[QueryExecutionContext]
    Status: Optional[QueryExecutionStatus]
    Statistics: Optional[QueryExecutionStatistics]
    WorkGroup: Optional[WorkGroupName]
    EngineVersion: Optional[EngineVersion]
    ExecutionParameters: Optional[ExecutionParameters]
    SubstatementType: Optional[String]


QueryExecutionList = List[QueryExecution]


class BatchGetQueryExecutionOutput(TypedDict, total=False):
    QueryExecutions: Optional[QueryExecutionList]
    UnprocessedQueryExecutionIds: Optional[UnprocessedQueryExecutionIdList]


BytesScannedCutoffValue = int


class CalculationConfiguration(TypedDict, total=False):
    """Contains configuration information for the calculation."""

    CodeBlock: Optional[CodeBlock]


class CalculationResult(TypedDict, total=False):
    """Contains information about an application-specific calculation result."""

    StdOutS3Uri: Optional[S3Uri]
    StdErrorS3Uri: Optional[S3Uri]
    ResultS3Uri: Optional[S3Uri]
    ResultType: Optional[CalculationResultType]


class CalculationStatistics(TypedDict, total=False):
    """Contains statistics for a notebook calculation."""

    DpuExecutionInMillis: Optional[Long]
    Progress: Optional[DescriptionString]


class CalculationStatus(TypedDict, total=False):
    """Contains information about the status of a notebook calculation."""

    SubmissionDateTime: Optional[Date]
    CompletionDateTime: Optional[Date]
    State: Optional[CalculationExecutionState]
    StateChangeReason: Optional[DescriptionString]


class CalculationSummary(TypedDict, total=False):
    """Summary information for a notebook calculation."""

    CalculationExecutionId: Optional[CalculationExecutionId]
    Description: Optional[DescriptionString]
    Status: Optional[CalculationStatus]


CalculationsList = List[CalculationSummary]


class CancelCapacityReservationInput(ServiceRequest):
    Name: CapacityReservationName


class CancelCapacityReservationOutput(TypedDict, total=False):
    pass


Timestamp = datetime


class CapacityAllocation(TypedDict, total=False):
    """Contains the submission time of a single allocation request for a
    capacity reservation and the most recent status of the attempted
    allocation.
    """

    Status: CapacityAllocationStatus
    StatusMessage: Optional[String]
    RequestTime: Timestamp
    RequestCompletionTime: Optional[Timestamp]


WorkGroupNamesList = List[WorkGroupName]


class CapacityAssignment(TypedDict, total=False):
    """A mapping between one or more workgroups and a capacity reservation."""

    WorkGroupNames: Optional[WorkGroupNamesList]


CapacityAssignmentsList = List[CapacityAssignment]


class CapacityAssignmentConfiguration(TypedDict, total=False):
    """Assigns Athena workgroups (and hence their queries) to capacity
    reservations. A capacity reservation can have only one capacity
    assignment configuration, but the capacity assignment configuration can
    be made up of multiple individual assignments. Each assignment specifies
    how Athena queries can consume capacity from the capacity reservation
    that their workgroup is mapped to.
    """

    CapacityReservationName: Optional[CapacityReservationName]
    CapacityAssignments: Optional[CapacityAssignmentsList]


class CapacityReservation(TypedDict, total=False):
    """A reservation for a specified number of data processing units (DPUs).
    When a reservation is initially created, it has no DPUs. Athena
    allocates DPUs until the allocated amount equals the requested amount.
    """

    Name: CapacityReservationName
    Status: CapacityReservationStatus
    TargetDpus: TargetDpusInteger
    AllocatedDpus: AllocatedDpusInteger
    LastAllocation: Optional[CapacityAllocation]
    LastSuccessfulAllocationTime: Optional[Timestamp]
    CreationTime: Timestamp


CapacityReservationsList = List[CapacityReservation]


class Column(TypedDict, total=False):
    """Contains metadata for a column in a table."""

    Name: NameString
    Type: Optional[TypeString]
    Comment: Optional[CommentString]


class ColumnInfo(TypedDict, total=False):
    """Information about the columns in a query execution result."""

    CatalogName: Optional[String]
    SchemaName: Optional[String]
    TableName: Optional[String]
    Name: String
    Label: Optional[String]
    Type: String
    Precision: Optional[Integer]
    Scale: Optional[Integer]
    Nullable: Optional[ColumnNullable]
    CaseSensitive: Optional[Boolean]


ColumnInfoList = List[ColumnInfo]
ColumnList = List[Column]


class Tag(TypedDict, total=False):
    """A label that you assign to a resource. Athena resources include
    workgroups, data catalogs, and capacity reservations. Each tag consists
    of a key and an optional value, both of which you define. For example,
    you can use tags to categorize Athena resources by purpose, owner, or
    environment. Use a consistent set of tag keys to make it easier to
    search and filter the resources in your account. For best practices, see
    `Tagging Best
    Practices <https://docs.aws.amazon.com/whitepapers/latest/tagging-best-practices/tagging-best-practices.html>`__.
    Tag keys can be from 1 to 128 UTF-8 Unicode characters, and tag values
    can be from 0 to 256 UTF-8 Unicode characters. Tags can use letters and
    numbers representable in UTF-8, and the following characters: + - = . _
    : / @. Tag keys and values are case-sensitive. Tag keys must be unique
    per resource. If you specify more than one tag, separate them by commas.
    """

    Key: Optional[TagKey]
    Value: Optional[TagValue]


TagList = List[Tag]


class CreateCapacityReservationInput(ServiceRequest):
    TargetDpus: TargetDpusInteger
    Name: CapacityReservationName
    Tags: Optional[TagList]


class CreateCapacityReservationOutput(TypedDict, total=False):
    pass


ParametersMap = Dict[KeyString, ParametersMapValue]


class CreateDataCatalogInput(ServiceRequest):
    Name: CatalogNameString
    Type: DataCatalogType
    Description: Optional[DescriptionString]
    Parameters: Optional[ParametersMap]
    Tags: Optional[TagList]


class CreateDataCatalogOutput(TypedDict, total=False):
    pass


class CreateNamedQueryInput(ServiceRequest):
    Name: NameString
    Description: Optional[DescriptionString]
    Database: DatabaseString
    QueryString: QueryString
    ClientRequestToken: Optional[IdempotencyToken]
    WorkGroup: Optional[WorkGroupName]


class CreateNamedQueryOutput(TypedDict, total=False):
    NamedQueryId: Optional[NamedQueryId]


class CreateNotebookInput(ServiceRequest):
    WorkGroup: WorkGroupName
    Name: NotebookName
    ClientRequestToken: Optional[ClientRequestToken]


class CreateNotebookOutput(TypedDict, total=False):
    NotebookId: Optional[NotebookId]


class CreatePreparedStatementInput(ServiceRequest):
    StatementName: StatementName
    WorkGroup: WorkGroupName
    QueryStatement: QueryString
    Description: Optional[DescriptionString]


class CreatePreparedStatementOutput(TypedDict, total=False):
    pass


class CreatePresignedNotebookUrlRequest(ServiceRequest):
    SessionId: SessionId


class CreatePresignedNotebookUrlResponse(TypedDict, total=False):
    NotebookUrl: String
    AuthToken: AuthToken
    AuthTokenExpirationTime: Long


class CustomerContentEncryptionConfiguration(TypedDict, total=False):
    """Specifies the KMS key that is used to encrypt the user's data stores in
    Athena. This setting does not apply to Athena SQL workgroups.
    """

    KmsKey: KmsKey


class WorkGroupConfiguration(TypedDict, total=False):
    """The configuration of the workgroup, which includes the location in
    Amazon S3 where query and calculation results are stored, the encryption
    option, if any, used for query and calculation results, whether the
    Amazon CloudWatch Metrics are enabled for the workgroup and whether
    workgroup settings override query settings, and the data usage limits
    for the amount of data scanned per query or per workgroup. The workgroup
    settings override is specified in ``EnforceWorkGroupConfiguration``
    (true/false) in the ``WorkGroupConfiguration``. See
    WorkGroupConfiguration$EnforceWorkGroupConfiguration.
    """

    ResultConfiguration: Optional[ResultConfiguration]
    EnforceWorkGroupConfiguration: Optional[BoxedBoolean]
    PublishCloudWatchMetricsEnabled: Optional[BoxedBoolean]
    BytesScannedCutoffPerQuery: Optional[BytesScannedCutoffValue]
    RequesterPaysEnabled: Optional[BoxedBoolean]
    EngineVersion: Optional[EngineVersion]
    AdditionalConfiguration: Optional[NameString]
    ExecutionRole: Optional[RoleArn]
    CustomerContentEncryptionConfiguration: Optional[CustomerContentEncryptionConfiguration]
    EnableMinimumEncryptionConfiguration: Optional[BoxedBoolean]


class CreateWorkGroupInput(ServiceRequest):
    Name: WorkGroupName
    Configuration: Optional[WorkGroupConfiguration]
    Description: Optional[WorkGroupDescriptionString]
    Tags: Optional[TagList]


class CreateWorkGroupOutput(TypedDict, total=False):
    pass


class DataCatalog(TypedDict, total=False):
    """Contains information about a data catalog in an Amazon Web Services
    account.

    In the Athena console, data catalogs are listed as "data sources" on the
    **Data sources** page under the **Data source name** column.
    """

    Name: CatalogNameString
    Description: Optional[DescriptionString]
    Type: DataCatalogType
    Parameters: Optional[ParametersMap]


class DataCatalogSummary(TypedDict, total=False):
    """The summary information for the data catalog, which includes its name
    and type.
    """

    CatalogName: Optional[CatalogNameString]
    Type: Optional[DataCatalogType]


DataCatalogSummaryList = List[DataCatalogSummary]


class Database(TypedDict, total=False):
    """Contains metadata information for a database in a data catalog."""

    Name: NameString
    Description: Optional[DescriptionString]
    Parameters: Optional[ParametersMap]


DatabaseList = List[Database]


class Datum(TypedDict, total=False):
    """A piece of data (a field in the table)."""

    VarCharValue: Optional[datumString]


class DeleteCapacityReservationInput(ServiceRequest):
    Name: CapacityReservationName


class DeleteCapacityReservationOutput(TypedDict, total=False):
    pass


class DeleteDataCatalogInput(ServiceRequest):
    Name: CatalogNameString


class DeleteDataCatalogOutput(TypedDict, total=False):
    pass


class DeleteNamedQueryInput(ServiceRequest):
    NamedQueryId: NamedQueryId


class DeleteNamedQueryOutput(TypedDict, total=False):
    pass


class DeleteNotebookInput(ServiceRequest):
    NotebookId: NotebookId


class DeleteNotebookOutput(TypedDict, total=False):
    pass


class DeletePreparedStatementInput(ServiceRequest):
    StatementName: StatementName
    WorkGroup: WorkGroupName


class DeletePreparedStatementOutput(TypedDict, total=False):
    pass


class DeleteWorkGroupInput(ServiceRequest):
    WorkGroup: WorkGroupName
    RecursiveDeleteOption: Optional[BoxedBoolean]


class DeleteWorkGroupOutput(TypedDict, total=False):
    pass


class EngineConfiguration(TypedDict, total=False):
    """Contains data processing unit (DPU) configuration settings and parameter
    mappings for a notebook engine.
    """

    CoordinatorDpuSize: Optional[CoordinatorDpuSize]
    MaxConcurrentDpus: MaxConcurrentDpus
    DefaultExecutorDpuSize: Optional[DefaultExecutorDpuSize]
    AdditionalConfigs: Optional[ParametersMap]
    SparkProperties: Optional[ParametersMap]


EngineVersionsList = List[EngineVersion]


class ExecutorsSummary(TypedDict, total=False):
    """Contains summary information about an executor."""

    ExecutorId: ExecutorId
    ExecutorType: Optional[ExecutorType]
    StartDateTime: Optional[Long]
    TerminationDateTime: Optional[Long]
    ExecutorState: Optional[ExecutorState]
    ExecutorSize: Optional[Long]


ExecutorsSummaryList = List[ExecutorsSummary]


class ExportNotebookInput(ServiceRequest):
    NotebookId: NotebookId


class NotebookMetadata(TypedDict, total=False):
    """Contains metadata for notebook, including the notebook name, ID,
    workgroup, and time created.
    """

    NotebookId: Optional[NotebookId]
    Name: Optional[NotebookName]
    WorkGroup: Optional[WorkGroupName]
    CreationTime: Optional[Date]
    Type: Optional[NotebookType]
    LastModifiedTime: Optional[Date]


class ExportNotebookOutput(TypedDict, total=False):
    NotebookMetadata: Optional[NotebookMetadata]
    Payload: Optional[Payload]


class FilterDefinition(TypedDict, total=False):
    """A string for searching notebook names."""

    Name: Optional[NotebookName]


class GetCalculationExecutionCodeRequest(ServiceRequest):
    CalculationExecutionId: CalculationExecutionId


class GetCalculationExecutionCodeResponse(TypedDict, total=False):
    CodeBlock: Optional[CodeBlock]


class GetCalculationExecutionRequest(ServiceRequest):
    CalculationExecutionId: CalculationExecutionId


class GetCalculationExecutionResponse(TypedDict, total=False):
    CalculationExecutionId: Optional[CalculationExecutionId]
    SessionId: Optional[SessionId]
    Description: Optional[DescriptionString]
    WorkingDirectory: Optional[S3Uri]
    Status: Optional[CalculationStatus]
    Statistics: Optional[CalculationStatistics]
    Result: Optional[CalculationResult]


class GetCalculationExecutionStatusRequest(ServiceRequest):
    CalculationExecutionId: CalculationExecutionId


class GetCalculationExecutionStatusResponse(TypedDict, total=False):
    Status: Optional[CalculationStatus]
    Statistics: Optional[CalculationStatistics]


class GetCapacityAssignmentConfigurationInput(ServiceRequest):
    CapacityReservationName: CapacityReservationName


class GetCapacityAssignmentConfigurationOutput(TypedDict, total=False):
    CapacityAssignmentConfiguration: CapacityAssignmentConfiguration


class GetCapacityReservationInput(ServiceRequest):
    Name: CapacityReservationName


class GetCapacityReservationOutput(TypedDict, total=False):
    CapacityReservation: CapacityReservation


class GetDataCatalogInput(ServiceRequest):
    Name: CatalogNameString


class GetDataCatalogOutput(TypedDict, total=False):
    DataCatalog: Optional[DataCatalog]


class GetDatabaseInput(ServiceRequest):
    CatalogName: CatalogNameString
    DatabaseName: NameString


class GetDatabaseOutput(TypedDict, total=False):
    Database: Optional[Database]


class GetNamedQueryInput(ServiceRequest):
    NamedQueryId: NamedQueryId


class GetNamedQueryOutput(TypedDict, total=False):
    NamedQuery: Optional[NamedQuery]


class GetNotebookMetadataInput(ServiceRequest):
    NotebookId: NotebookId


class GetNotebookMetadataOutput(TypedDict, total=False):
    NotebookMetadata: Optional[NotebookMetadata]


class GetPreparedStatementInput(ServiceRequest):
    StatementName: StatementName
    WorkGroup: WorkGroupName


class GetPreparedStatementOutput(TypedDict, total=False):
    PreparedStatement: Optional[PreparedStatement]


class GetQueryExecutionInput(ServiceRequest):
    QueryExecutionId: QueryExecutionId


class GetQueryExecutionOutput(TypedDict, total=False):
    QueryExecution: Optional[QueryExecution]


class GetQueryResultsInput(ServiceRequest):
    QueryExecutionId: QueryExecutionId
    NextToken: Optional[Token]
    MaxResults: Optional[MaxQueryResults]


class ResultSetMetadata(TypedDict, total=False):
    """The metadata that describes the column structure and data types of a
    table of query results. To return a ``ResultSetMetadata`` object, use
    GetQueryResults.
    """

    ColumnInfo: Optional[ColumnInfoList]


datumList = List[Datum]


class Row(TypedDict, total=False):
    """The rows that make up a query result table."""

    Data: Optional[datumList]


RowList = List[Row]


class ResultSet(TypedDict, total=False):
    """The metadata and rows that make up a query result set. The metadata
    describes the column structure and data types. To return a ``ResultSet``
    object, use GetQueryResults.
    """

    Rows: Optional[RowList]
    ResultSetMetadata: Optional[ResultSetMetadata]


class GetQueryResultsOutput(TypedDict, total=False):
    UpdateCount: Optional[Long]
    ResultSet: Optional[ResultSet]
    NextToken: Optional[Token]


class GetQueryRuntimeStatisticsInput(ServiceRequest):
    QueryExecutionId: QueryExecutionId


class QueryStage(TypedDict, total=False):
    """Stage statistics such as input and output rows and bytes, execution time
    and stage state. This information also includes substages and the query
    stage plan.
    """

    StageId: Optional["Long"]
    State: Optional["String"]
    OutputBytes: Optional["Long"]
    OutputRows: Optional["Long"]
    InputBytes: Optional["Long"]
    InputRows: Optional["Long"]
    ExecutionTime: Optional["Long"]
    QueryStagePlan: Optional["QueryStagePlanNode"]
    SubStages: Optional["QueryStages"]


QueryStages = List[QueryStage]
StringList = List[String]


class QueryStagePlanNode(TypedDict, total=False):
    """Stage plan information such as name, identifier, sub plans, and remote
    sources.
    """

    Name: Optional["String"]
    Identifier: Optional["String"]
    Children: Optional["QueryStagePlanNodes"]
    RemoteSources: Optional["StringList"]


QueryStagePlanNodes = List[QueryStagePlanNode]


class QueryRuntimeStatisticsRows(TypedDict, total=False):
    """Statistics such as input rows and bytes read by the query, rows and
    bytes output by the query, and the number of rows written by the query.
    """

    InputRows: Optional[Long]
    InputBytes: Optional[Long]
    OutputBytes: Optional[Long]
    OutputRows: Optional[Long]


class QueryRuntimeStatisticsTimeline(TypedDict, total=False):
    """Timeline statistics such as query queue time, planning time, execution
    time, service processing time, and total execution time.
    """

    QueryQueueTimeInMillis: Optional[Long]
    QueryPlanningTimeInMillis: Optional[Long]
    EngineExecutionTimeInMillis: Optional[Long]
    ServiceProcessingTimeInMillis: Optional[Long]
    TotalExecutionTimeInMillis: Optional[Long]


class QueryRuntimeStatistics(TypedDict, total=False):
    """The query execution timeline, statistics on input and output rows and
    bytes, and the different query stages that form the query execution
    plan.
    """

    Timeline: Optional[QueryRuntimeStatisticsTimeline]
    Rows: Optional[QueryRuntimeStatisticsRows]
    OutputStage: Optional[QueryStage]


class GetQueryRuntimeStatisticsOutput(TypedDict, total=False):
    QueryRuntimeStatistics: Optional[QueryRuntimeStatistics]


class GetSessionRequest(ServiceRequest):
    SessionId: SessionId


class SessionStatistics(TypedDict, total=False):
    """Contains statistics for a session."""

    DpuExecutionInMillis: Optional[Long]


class SessionStatus(TypedDict, total=False):
    """Contains information about the status of a session."""

    StartDateTime: Optional[Date]
    LastModifiedDateTime: Optional[Date]
    EndDateTime: Optional[Date]
    IdleSinceDateTime: Optional[Date]
    State: Optional[SessionState]
    StateChangeReason: Optional[DescriptionString]


class SessionConfiguration(TypedDict, total=False):
    """Contains session configuration information."""

    ExecutionRole: Optional[RoleArn]
    WorkingDirectory: Optional[ResultOutputLocation]
    IdleTimeoutSeconds: Optional[Long]
    EncryptionConfiguration: Optional[EncryptionConfiguration]


class GetSessionResponse(TypedDict, total=False):
    SessionId: Optional[SessionId]
    Description: Optional[DescriptionString]
    WorkGroup: Optional[WorkGroupName]
    EngineVersion: Optional[NameString]
    EngineConfiguration: Optional[EngineConfiguration]
    NotebookVersion: Optional[NameString]
    SessionConfiguration: Optional[SessionConfiguration]
    Status: Optional[SessionStatus]
    Statistics: Optional[SessionStatistics]


class GetSessionStatusRequest(ServiceRequest):
    SessionId: SessionId


class GetSessionStatusResponse(TypedDict, total=False):
    SessionId: Optional[SessionId]
    Status: Optional[SessionStatus]


class GetTableMetadataInput(ServiceRequest):
    CatalogName: CatalogNameString
    DatabaseName: NameString
    TableName: NameString


class TableMetadata(TypedDict, total=False):
    """Contains metadata for a table."""

    Name: NameString
    CreateTime: Optional[Timestamp]
    LastAccessTime: Optional[Timestamp]
    TableType: Optional[TableTypeString]
    Columns: Optional[ColumnList]
    PartitionKeys: Optional[ColumnList]
    Parameters: Optional[ParametersMap]


class GetTableMetadataOutput(TypedDict, total=False):
    TableMetadata: Optional[TableMetadata]


class GetWorkGroupInput(ServiceRequest):
    WorkGroup: WorkGroupName


class WorkGroup(TypedDict, total=False):
    """A workgroup, which contains a name, description, creation time, state,
    and other configuration, listed under WorkGroup$Configuration. Each
    workgroup enables you to isolate queries for you or your group of users
    from other queries in the same account, to configure the query results
    location and the encryption configuration (known as workgroup settings),
    to enable sending query metrics to Amazon CloudWatch, and to establish
    per-query data usage control limits for all queries in a workgroup. The
    workgroup settings override is specified in
    ``EnforceWorkGroupConfiguration`` (true/false) in the
    ``WorkGroupConfiguration``. See
    WorkGroupConfiguration$EnforceWorkGroupConfiguration.
    """

    Name: WorkGroupName
    State: Optional[WorkGroupState]
    Configuration: Optional[WorkGroupConfiguration]
    Description: Optional[WorkGroupDescriptionString]
    CreationTime: Optional[Date]


class GetWorkGroupOutput(TypedDict, total=False):
    WorkGroup: Optional[WorkGroup]


class ImportNotebookInput(ServiceRequest):
    WorkGroup: WorkGroupName
    Name: NotebookName
    Payload: Payload
    Type: NotebookType
    ClientRequestToken: Optional[ClientRequestToken]


class ImportNotebookOutput(TypedDict, total=False):
    NotebookId: Optional[NotebookId]


class ListApplicationDPUSizesInput(ServiceRequest):
    MaxResults: Optional[MaxApplicationDPUSizesCount]
    NextToken: Optional[Token]


class ListApplicationDPUSizesOutput(TypedDict, total=False):
    ApplicationDPUSizes: Optional[ApplicationDPUSizesList]
    NextToken: Optional[Token]


class ListCalculationExecutionsRequest(ServiceRequest):
    SessionId: SessionId
    StateFilter: Optional[CalculationExecutionState]
    MaxResults: Optional[MaxCalculationsCount]
    NextToken: Optional[SessionManagerToken]


class ListCalculationExecutionsResponse(TypedDict, total=False):
    NextToken: Optional[SessionManagerToken]
    Calculations: Optional[CalculationsList]


class ListCapacityReservationsInput(ServiceRequest):
    NextToken: Optional[Token]
    MaxResults: Optional[MaxCapacityReservationsCount]


class ListCapacityReservationsOutput(TypedDict, total=False):
    NextToken: Optional[Token]
    CapacityReservations: CapacityReservationsList


class ListDataCatalogsInput(ServiceRequest):
    NextToken: Optional[Token]
    MaxResults: Optional[MaxDataCatalogsCount]


class ListDataCatalogsOutput(TypedDict, total=False):
    DataCatalogsSummary: Optional[DataCatalogSummaryList]
    NextToken: Optional[Token]


class ListDatabasesInput(ServiceRequest):
    CatalogName: CatalogNameString
    NextToken: Optional[Token]
    MaxResults: Optional[MaxDatabasesCount]


class ListDatabasesOutput(TypedDict, total=False):
    DatabaseList: Optional[DatabaseList]
    NextToken: Optional[Token]


class ListEngineVersionsInput(ServiceRequest):
    NextToken: Optional[Token]
    MaxResults: Optional[MaxEngineVersionsCount]


class ListEngineVersionsOutput(TypedDict, total=False):
    EngineVersions: Optional[EngineVersionsList]
    NextToken: Optional[Token]


class ListExecutorsRequest(ServiceRequest):
    SessionId: SessionId
    ExecutorStateFilter: Optional[ExecutorState]
    MaxResults: Optional[MaxListExecutorsCount]
    NextToken: Optional[SessionManagerToken]


class ListExecutorsResponse(TypedDict, total=False):
    SessionId: SessionId
    NextToken: Optional[SessionManagerToken]
    ExecutorsSummary: Optional[ExecutorsSummaryList]


class ListNamedQueriesInput(ServiceRequest):
    NextToken: Optional[Token]
    MaxResults: Optional[MaxNamedQueriesCount]
    WorkGroup: Optional[WorkGroupName]


class ListNamedQueriesOutput(TypedDict, total=False):
    NamedQueryIds: Optional[NamedQueryIdList]
    NextToken: Optional[Token]


class ListNotebookMetadataInput(ServiceRequest):
    Filters: Optional[FilterDefinition]
    NextToken: Optional[Token]
    MaxResults: Optional[MaxNotebooksCount]
    WorkGroup: WorkGroupName


NotebookMetadataArray = List[NotebookMetadata]


class ListNotebookMetadataOutput(TypedDict, total=False):
    NextToken: Optional[Token]
    NotebookMetadataList: Optional[NotebookMetadataArray]


class ListNotebookSessionsRequest(ServiceRequest):
    NotebookId: NotebookId
    MaxResults: Optional[MaxSessionsCount]
    NextToken: Optional[Token]


class NotebookSessionSummary(TypedDict, total=False):
    """Contains the notebook session ID and notebook session creation time."""

    SessionId: Optional[SessionId]
    CreationTime: Optional[Date]


NotebookSessionsList = List[NotebookSessionSummary]


class ListNotebookSessionsResponse(TypedDict, total=False):
    NotebookSessionsList: NotebookSessionsList
    NextToken: Optional[Token]


class ListPreparedStatementsInput(ServiceRequest):
    WorkGroup: WorkGroupName
    NextToken: Optional[Token]
    MaxResults: Optional[MaxPreparedStatementsCount]


class PreparedStatementSummary(TypedDict, total=False):
    """The name and last modified time of the prepared statement."""

    StatementName: Optional[StatementName]
    LastModifiedTime: Optional[Date]


PreparedStatementsList = List[PreparedStatementSummary]


class ListPreparedStatementsOutput(TypedDict, total=False):
    PreparedStatements: Optional[PreparedStatementsList]
    NextToken: Optional[Token]


class ListQueryExecutionsInput(ServiceRequest):
    NextToken: Optional[Token]
    MaxResults: Optional[MaxQueryExecutionsCount]
    WorkGroup: Optional[WorkGroupName]


class ListQueryExecutionsOutput(TypedDict, total=False):
    QueryExecutionIds: Optional[QueryExecutionIdList]
    NextToken: Optional[Token]


class ListSessionsRequest(ServiceRequest):
    WorkGroup: WorkGroupName
    StateFilter: Optional[SessionState]
    MaxResults: Optional[MaxSessionsCount]
    NextToken: Optional[SessionManagerToken]


class SessionSummary(TypedDict, total=False):
    """Contains summary information about a session."""

    SessionId: Optional[SessionId]
    Description: Optional[DescriptionString]
    EngineVersion: Optional[EngineVersion]
    NotebookVersion: Optional[NameString]
    Status: Optional[SessionStatus]


SessionsList = List[SessionSummary]


class ListSessionsResponse(TypedDict, total=False):
    NextToken: Optional[SessionManagerToken]
    Sessions: Optional[SessionsList]


class ListTableMetadataInput(ServiceRequest):
    CatalogName: CatalogNameString
    DatabaseName: NameString
    Expression: Optional[ExpressionString]
    NextToken: Optional[Token]
    MaxResults: Optional[MaxTableMetadataCount]


TableMetadataList = List[TableMetadata]


class ListTableMetadataOutput(TypedDict, total=False):
    TableMetadataList: Optional[TableMetadataList]
    NextToken: Optional[Token]


class ListTagsForResourceInput(ServiceRequest):
    ResourceARN: AmazonResourceName
    NextToken: Optional[Token]
    MaxResults: Optional[MaxTagsCount]


class ListTagsForResourceOutput(TypedDict, total=False):
    Tags: Optional[TagList]
    NextToken: Optional[Token]


class ListWorkGroupsInput(ServiceRequest):
    NextToken: Optional[Token]
    MaxResults: Optional[MaxWorkGroupsCount]


class WorkGroupSummary(TypedDict, total=False):
    """The summary information for the workgroup, which includes its name,
    state, description, and the date and time it was created.
    """

    Name: Optional[WorkGroupName]
    State: Optional[WorkGroupState]
    Description: Optional[WorkGroupDescriptionString]
    CreationTime: Optional[Date]
    EngineVersion: Optional[EngineVersion]


WorkGroupsList = List[WorkGroupSummary]


class ListWorkGroupsOutput(TypedDict, total=False):
    WorkGroups: Optional[WorkGroupsList]
    NextToken: Optional[Token]


class PutCapacityAssignmentConfigurationInput(ServiceRequest):
    CapacityReservationName: CapacityReservationName
    CapacityAssignments: CapacityAssignmentsList


class PutCapacityAssignmentConfigurationOutput(TypedDict, total=False):
    pass


class ResultConfigurationUpdates(TypedDict, total=False):
    """The information about the updates in the query results, such as output
    location and encryption configuration for the query results.
    """

    OutputLocation: Optional[ResultOutputLocation]
    RemoveOutputLocation: Optional[BoxedBoolean]
    EncryptionConfiguration: Optional[EncryptionConfiguration]
    RemoveEncryptionConfiguration: Optional[BoxedBoolean]
    ExpectedBucketOwner: Optional[AwsAccountId]
    RemoveExpectedBucketOwner: Optional[BoxedBoolean]
    AclConfiguration: Optional[AclConfiguration]
    RemoveAclConfiguration: Optional[BoxedBoolean]


class StartCalculationExecutionRequest(ServiceRequest):
    SessionId: SessionId
    Description: Optional[DescriptionString]
    CalculationConfiguration: Optional[CalculationConfiguration]
    CodeBlock: Optional[CodeBlock]
    ClientRequestToken: Optional[IdempotencyToken]


class StartCalculationExecutionResponse(TypedDict, total=False):
    CalculationExecutionId: Optional[CalculationExecutionId]
    State: Optional[CalculationExecutionState]


class StartQueryExecutionInput(ServiceRequest):
    QueryString: QueryString
    ClientRequestToken: Optional[IdempotencyToken]
    QueryExecutionContext: Optional[QueryExecutionContext]
    ResultConfiguration: Optional[ResultConfiguration]
    WorkGroup: Optional[WorkGroupName]
    ExecutionParameters: Optional[ExecutionParameters]
    ResultReuseConfiguration: Optional[ResultReuseConfiguration]


class StartQueryExecutionOutput(TypedDict, total=False):
    QueryExecutionId: Optional[QueryExecutionId]


class StartSessionRequest(ServiceRequest):
    Description: Optional[DescriptionString]
    WorkGroup: WorkGroupName
    EngineConfiguration: EngineConfiguration
    NotebookVersion: Optional[NameString]
    SessionIdleTimeoutInMinutes: Optional[SessionIdleTimeoutInMinutes]
    ClientRequestToken: Optional[IdempotencyToken]


class StartSessionResponse(TypedDict, total=False):
    SessionId: Optional[SessionId]
    State: Optional[SessionState]


class StopCalculationExecutionRequest(ServiceRequest):
    CalculationExecutionId: CalculationExecutionId


class StopCalculationExecutionResponse(TypedDict, total=False):
    State: Optional[CalculationExecutionState]


class StopQueryExecutionInput(ServiceRequest):
    QueryExecutionId: QueryExecutionId


class StopQueryExecutionOutput(TypedDict, total=False):
    pass


TagKeyList = List[TagKey]


class TagResourceInput(ServiceRequest):
    ResourceARN: AmazonResourceName
    Tags: TagList


class TagResourceOutput(TypedDict, total=False):
    pass


class TerminateSessionRequest(ServiceRequest):
    SessionId: SessionId


class TerminateSessionResponse(TypedDict, total=False):
    State: Optional[SessionState]


class UntagResourceInput(ServiceRequest):
    ResourceARN: AmazonResourceName
    TagKeys: TagKeyList


class UntagResourceOutput(TypedDict, total=False):
    pass


class UpdateCapacityReservationInput(ServiceRequest):
    TargetDpus: TargetDpusInteger
    Name: CapacityReservationName


class UpdateCapacityReservationOutput(TypedDict, total=False):
    pass


class UpdateDataCatalogInput(ServiceRequest):
    Name: CatalogNameString
    Type: DataCatalogType
    Description: Optional[DescriptionString]
    Parameters: Optional[ParametersMap]


class UpdateDataCatalogOutput(TypedDict, total=False):
    pass


class UpdateNamedQueryInput(ServiceRequest):
    NamedQueryId: NamedQueryId
    Name: NameString
    Description: Optional[NamedQueryDescriptionString]
    QueryString: QueryString


class UpdateNamedQueryOutput(TypedDict, total=False):
    pass


class UpdateNotebookInput(ServiceRequest):
    NotebookId: NotebookId
    Payload: Payload
    Type: NotebookType
    SessionId: Optional[SessionId]
    ClientRequestToken: Optional[ClientRequestToken]


class UpdateNotebookMetadataInput(ServiceRequest):
    NotebookId: NotebookId
    ClientRequestToken: Optional[ClientRequestToken]
    Name: NotebookName


class UpdateNotebookMetadataOutput(TypedDict, total=False):
    pass


class UpdateNotebookOutput(TypedDict, total=False):
    pass


class UpdatePreparedStatementInput(ServiceRequest):
    StatementName: StatementName
    WorkGroup: WorkGroupName
    QueryStatement: QueryString
    Description: Optional[DescriptionString]


class UpdatePreparedStatementOutput(TypedDict, total=False):
    pass


class WorkGroupConfigurationUpdates(TypedDict, total=False):
    """The configuration information that will be updated for this workgroup,
    which includes the location in Amazon S3 where query and calculation
    results are stored, the encryption option, if any, used for query
    results, whether the Amazon CloudWatch Metrics are enabled for the
    workgroup, whether the workgroup settings override the client-side
    settings, and the data usage limit for the amount of bytes scanned per
    query, if it is specified.
    """

    EnforceWorkGroupConfiguration: Optional[BoxedBoolean]
    ResultConfigurationUpdates: Optional[ResultConfigurationUpdates]
    PublishCloudWatchMetricsEnabled: Optional[BoxedBoolean]
    BytesScannedCutoffPerQuery: Optional[BytesScannedCutoffValue]
    RemoveBytesScannedCutoffPerQuery: Optional[BoxedBoolean]
    RequesterPaysEnabled: Optional[BoxedBoolean]
    EngineVersion: Optional[EngineVersion]
    RemoveCustomerContentEncryptionConfiguration: Optional[BoxedBoolean]
    AdditionalConfiguration: Optional[NameString]
    ExecutionRole: Optional[RoleArn]
    CustomerContentEncryptionConfiguration: Optional[CustomerContentEncryptionConfiguration]
    EnableMinimumEncryptionConfiguration: Optional[BoxedBoolean]


class UpdateWorkGroupInput(ServiceRequest):
    WorkGroup: WorkGroupName
    Description: Optional[WorkGroupDescriptionString]
    ConfigurationUpdates: Optional[WorkGroupConfigurationUpdates]
    State: Optional[WorkGroupState]


class UpdateWorkGroupOutput(TypedDict, total=False):
    pass


class AthenaApi:
    service = "athena"
    version = "2017-05-18"

    @handler("BatchGetNamedQuery")
    def batch_get_named_query(
        self, context: RequestContext, named_query_ids: NamedQueryIdList
    ) -> BatchGetNamedQueryOutput:
        """Returns the details of a single named query or a list of up to 50
        queries, which you provide as an array of query ID strings. Requires you
        to have access to the workgroup in which the queries were saved. Use
        ListNamedQueriesInput to get the list of named query IDs in the
        specified workgroup. If information could not be retrieved for a
        submitted query ID, information about the query ID submitted is listed
        under UnprocessedNamedQueryId. Named queries differ from executed
        queries. Use BatchGetQueryExecutionInput to get details about each
        unique query execution, and ListQueryExecutionsInput to get a list of
        query execution IDs.

        :param named_query_ids: An array of query IDs.
        :returns: BatchGetNamedQueryOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("BatchGetPreparedStatement")
    def batch_get_prepared_statement(
        self,
        context: RequestContext,
        prepared_statement_names: PreparedStatementNameList,
        work_group: WorkGroupName,
    ) -> BatchGetPreparedStatementOutput:
        """Returns the details of a single prepared statement or a list of up to
        256 prepared statements for the array of prepared statement names that
        you provide. Requires you to have access to the workgroup to which the
        prepared statements belong. If a prepared statement cannot be retrieved
        for the name specified, the statement is listed in
        ``UnprocessedPreparedStatementNames``.

        :param prepared_statement_names: A list of prepared statement names to return.
        :param work_group: The name of the workgroup to which the prepared statements belong.
        :returns: BatchGetPreparedStatementOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("BatchGetQueryExecution")
    def batch_get_query_execution(
        self, context: RequestContext, query_execution_ids: QueryExecutionIdList
    ) -> BatchGetQueryExecutionOutput:
        """Returns the details of a single query execution or a list of up to 50
        query executions, which you provide as an array of query execution ID
        strings. Requires you to have access to the workgroup in which the
        queries ran. To get a list of query execution IDs, use
        ListQueryExecutionsInput$WorkGroup. Query executions differ from named
        (saved) queries. Use BatchGetNamedQueryInput to get details about named
        queries.

        :param query_execution_ids: An array of query execution IDs.
        :returns: BatchGetQueryExecutionOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("CancelCapacityReservation")
    def cancel_capacity_reservation(
        self, context: RequestContext, name: CapacityReservationName
    ) -> CancelCapacityReservationOutput:
        """Cancels the capacity reservation with the specified name. Cancelled
        reservations remain in your account and will be deleted 45 days after
        cancellation. During the 45 days, you cannot re-purpose or reuse a
        reservation that has been cancelled, but you can refer to its tags and
        view it for historical reference.

        :param name: The name of the capacity reservation to cancel.
        :returns: CancelCapacityReservationOutput
        :raises InvalidRequestException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("CreateCapacityReservation")
    def create_capacity_reservation(
        self,
        context: RequestContext,
        target_dpus: TargetDpusInteger,
        name: CapacityReservationName,
        tags: TagList = None,
    ) -> CreateCapacityReservationOutput:
        """Creates a capacity reservation with the specified name and number of
        requested data processing units.

        :param target_dpus: The number of requested data processing units.
        :param name: The name of the capacity reservation to create.
        :param tags: The tags for the capacity reservation.
        :returns: CreateCapacityReservationOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("CreateDataCatalog", expand=False)
    def create_data_catalog(
        self, context: RequestContext, request: CreateDataCatalogInput
    ) -> CreateDataCatalogOutput:
        """Creates (registers) a data catalog with the specified name and
        properties. Catalogs created are visible to all users of the same Amazon
        Web Services account.

        :param name: The name of the data catalog to create.
        :param type: The type of data catalog to create: ``LAMBDA`` for a federated catalog,
        ``HIVE`` for an external hive metastore, or ``GLUE`` for an Glue Data
        Catalog.
        :param description: A description of the data catalog to be created.
        :param parameters: Specifies the Lambda function or functions to use for creating the data
        catalog.
        :param tags: A list of comma separated tags to add to the data catalog that is
        created.
        :returns: CreateDataCatalogOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("CreateNamedQuery")
    def create_named_query(
        self,
        context: RequestContext,
        name: NameString,
        database: DatabaseString,
        query_string: QueryString,
        description: DescriptionString = None,
        client_request_token: IdempotencyToken = None,
        work_group: WorkGroupName = None,
    ) -> CreateNamedQueryOutput:
        """Creates a named query in the specified workgroup. Requires that you have
        access to the workgroup.

        For code samples using the Amazon Web Services SDK for Java, see
        `Examples and Code
        Samples <http://docs.aws.amazon.com/athena/latest/ug/code-samples.html>`__
        in the *Amazon Athena User Guide*.

        :param name: The query name.
        :param database: The database to which the query belongs.
        :param query_string: The contents of the query with all query statements.
        :param description: The query description.
        :param client_request_token: A unique case-sensitive string used to ensure the request to create the
        query is idempotent (executes only once).
        :param work_group: The name of the workgroup in which the named query is being created.
        :returns: CreateNamedQueryOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("CreateNotebook")
    def create_notebook(
        self,
        context: RequestContext,
        work_group: WorkGroupName,
        name: NotebookName,
        client_request_token: ClientRequestToken = None,
    ) -> CreateNotebookOutput:
        """Creates an empty ``ipynb`` file in the specified Apache Spark enabled
        workgroup. Throws an error if a file in the workgroup with the same name
        already exists.

        :param work_group: The name of the Spark enabled workgroup in which the notebook will be
        created.
        :param name: The name of the ``ipynb`` file to be created in the Spark workgroup,
        without the ``.
        :param client_request_token: A unique case-sensitive string used to ensure the request to create the
        notebook is idempotent (executes only once).
        :returns: CreateNotebookOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises TooManyRequestsException:
        """
        raise NotImplementedError

    @handler("CreatePreparedStatement")
    def create_prepared_statement(
        self,
        context: RequestContext,
        statement_name: StatementName,
        work_group: WorkGroupName,
        query_statement: QueryString,
        description: DescriptionString = None,
    ) -> CreatePreparedStatementOutput:
        """Creates a prepared statement for use with SQL queries in Athena.

        :param statement_name: The name of the prepared statement.
        :param work_group: The name of the workgroup to which the prepared statement belongs.
        :param query_statement: The query string for the prepared statement.
        :param description: The description of the prepared statement.
        :returns: CreatePreparedStatementOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("CreatePresignedNotebookUrl")
    def create_presigned_notebook_url(
        self, context: RequestContext, session_id: SessionId
    ) -> CreatePresignedNotebookUrlResponse:
        """Gets an authentication token and the URL at which the notebook can be
        accessed. During programmatic access, ``CreatePresignedNotebookUrl``
        must be called every 10 minutes to refresh the authentication token. For
        information about granting programmatic access, see `Grant programmatic
        access <https://docs.aws.amazon.com/athena/latest/ug/setting-up.html#setting-up-grant-programmatic-access>`__.

        :param session_id: The session ID.
        :returns: CreatePresignedNotebookUrlResponse
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises ResourceNotFoundException:
        """
        raise NotImplementedError

    @handler("CreateWorkGroup")
    def create_work_group(
        self,
        context: RequestContext,
        name: WorkGroupName,
        configuration: WorkGroupConfiguration = None,
        description: WorkGroupDescriptionString = None,
        tags: TagList = None,
    ) -> CreateWorkGroupOutput:
        """Creates a workgroup with the specified name. A workgroup can be an
        Apache Spark enabled workgroup or an Athena SQL workgroup.

        :param name: The workgroup name.
        :param configuration: Contains configuration information for creating an Athena SQL workgroup
        or Spark enabled Athena workgroup.
        :param description: The workgroup description.
        :param tags: A list of comma separated tags to add to the workgroup that is created.
        :returns: CreateWorkGroupOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("DeleteCapacityReservation")
    def delete_capacity_reservation(
        self, context: RequestContext, name: CapacityReservationName
    ) -> DeleteCapacityReservationOutput:
        """Deletes a cancelled capacity reservation. A reservation must be
        cancelled before it can be deleted. A deleted reservation is immediately
        removed from your account and can no longer be referenced, including by
        its ARN. A deleted reservation cannot be called by
        ``GetCapacityReservation``, and deleted reservations do not appear in
        the output of ``ListCapacityReservations``.

        :param name: The name of the capacity reservation to delete.
        :returns: DeleteCapacityReservationOutput
        :raises InvalidRequestException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("DeleteDataCatalog")
    def delete_data_catalog(
        self, context: RequestContext, name: CatalogNameString
    ) -> DeleteDataCatalogOutput:
        """Deletes a data catalog.

        :param name: The name of the data catalog to delete.
        :returns: DeleteDataCatalogOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("DeleteNamedQuery")
    def delete_named_query(
        self, context: RequestContext, named_query_id: NamedQueryId
    ) -> DeleteNamedQueryOutput:
        """Deletes the named query if you have access to the workgroup in which the
        query was saved.

        For code samples using the Amazon Web Services SDK for Java, see
        `Examples and Code
        Samples <http://docs.aws.amazon.com/athena/latest/ug/code-samples.html>`__
        in the *Amazon Athena User Guide*.

        :param named_query_id: The unique ID of the query to delete.
        :returns: DeleteNamedQueryOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("DeleteNotebook")
    def delete_notebook(
        self, context: RequestContext, notebook_id: NotebookId
    ) -> DeleteNotebookOutput:
        """Deletes the specified notebook.

        :param notebook_id: The ID of the notebook to delete.
        :returns: DeleteNotebookOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises TooManyRequestsException:
        """
        raise NotImplementedError

    @handler("DeletePreparedStatement")
    def delete_prepared_statement(
        self, context: RequestContext, statement_name: StatementName, work_group: WorkGroupName
    ) -> DeletePreparedStatementOutput:
        """Deletes the prepared statement with the specified name from the
        specified workgroup.

        :param statement_name: The name of the prepared statement to delete.
        :param work_group: The workgroup to which the statement to be deleted belongs.
        :returns: DeletePreparedStatementOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises ResourceNotFoundException:
        """
        raise NotImplementedError

    @handler("DeleteWorkGroup")
    def delete_work_group(
        self,
        context: RequestContext,
        work_group: WorkGroupName,
        recursive_delete_option: BoxedBoolean = None,
    ) -> DeleteWorkGroupOutput:
        """Deletes the workgroup with the specified name. The primary workgroup
        cannot be deleted.

        :param work_group: The unique name of the workgroup to delete.
        :param recursive_delete_option: The option to delete the workgroup and its contents even if the
        workgroup contains any named queries, query executions, or notebooks.
        :returns: DeleteWorkGroupOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("ExportNotebook")
    def export_notebook(
        self, context: RequestContext, notebook_id: NotebookId
    ) -> ExportNotebookOutput:
        """Exports the specified notebook and its metadata.

        :param notebook_id: The ID of the notebook to export.
        :returns: ExportNotebookOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises TooManyRequestsException:
        """
        raise NotImplementedError

    @handler("GetCalculationExecution")
    def get_calculation_execution(
        self, context: RequestContext, calculation_execution_id: CalculationExecutionId
    ) -> GetCalculationExecutionResponse:
        """Describes a previously submitted calculation execution.

        :param calculation_execution_id: The calculation execution UUID.
        :returns: GetCalculationExecutionResponse
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises ResourceNotFoundException:
        """
        raise NotImplementedError

    @handler("GetCalculationExecutionCode")
    def get_calculation_execution_code(
        self, context: RequestContext, calculation_execution_id: CalculationExecutionId
    ) -> GetCalculationExecutionCodeResponse:
        """Retrieves the unencrypted code that was executed for the calculation.

        :param calculation_execution_id: The calculation execution UUID.
        :returns: GetCalculationExecutionCodeResponse
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises ResourceNotFoundException:
        """
        raise NotImplementedError

    @handler("GetCalculationExecutionStatus")
    def get_calculation_execution_status(
        self, context: RequestContext, calculation_execution_id: CalculationExecutionId
    ) -> GetCalculationExecutionStatusResponse:
        """Gets the status of a current calculation.

        :param calculation_execution_id: The calculation execution UUID.
        :returns: GetCalculationExecutionStatusResponse
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises ResourceNotFoundException:
        """
        raise NotImplementedError

    @handler("GetCapacityAssignmentConfiguration")
    def get_capacity_assignment_configuration(
        self, context: RequestContext, capacity_reservation_name: CapacityReservationName
    ) -> GetCapacityAssignmentConfigurationOutput:
        """Gets the capacity assignment configuration for a capacity reservation,
        if one exists.

        :param capacity_reservation_name: The name of the capacity reservation to retrieve the capacity assignment
        configuration for.
        :returns: GetCapacityAssignmentConfigurationOutput
        :raises InvalidRequestException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("GetCapacityReservation")
    def get_capacity_reservation(
        self, context: RequestContext, name: CapacityReservationName
    ) -> GetCapacityReservationOutput:
        """Returns information about the capacity reservation with the specified
        name.

        :param name: The name of the capacity reservation.
        :returns: GetCapacityReservationOutput
        :raises InvalidRequestException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("GetDataCatalog")
    def get_data_catalog(
        self, context: RequestContext, name: CatalogNameString
    ) -> GetDataCatalogOutput:
        """Returns the specified data catalog.

        :param name: The name of the data catalog to return.
        :returns: GetDataCatalogOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("GetDatabase")
    def get_database(
        self, context: RequestContext, catalog_name: CatalogNameString, database_name: NameString
    ) -> GetDatabaseOutput:
        """Returns a database object for the specified database and data catalog.

        :param catalog_name: The name of the data catalog that contains the database to return.
        :param database_name: The name of the database to return.
        :returns: GetDatabaseOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises MetadataException:
        """
        raise NotImplementedError

    @handler("GetNamedQuery")
    def get_named_query(
        self, context: RequestContext, named_query_id: NamedQueryId
    ) -> GetNamedQueryOutput:
        """Returns information about a single query. Requires that you have access
        to the workgroup in which the query was saved.

        :param named_query_id: The unique ID of the query.
        :returns: GetNamedQueryOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("GetNotebookMetadata")
    def get_notebook_metadata(
        self, context: RequestContext, notebook_id: NotebookId
    ) -> GetNotebookMetadataOutput:
        """Retrieves notebook metadata for the specified notebook ID.

        :param notebook_id: The ID of the notebook whose metadata is to be retrieved.
        :returns: GetNotebookMetadataOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises TooManyRequestsException:
        """
        raise NotImplementedError

    @handler("GetPreparedStatement")
    def get_prepared_statement(
        self, context: RequestContext, statement_name: StatementName, work_group: WorkGroupName
    ) -> GetPreparedStatementOutput:
        """Retrieves the prepared statement with the specified name from the
        specified workgroup.

        :param statement_name: The name of the prepared statement to retrieve.
        :param work_group: The workgroup to which the statement to be retrieved belongs.
        :returns: GetPreparedStatementOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises ResourceNotFoundException:
        """
        raise NotImplementedError

    @handler("GetQueryExecution")
    def get_query_execution(
        self, context: RequestContext, query_execution_id: QueryExecutionId
    ) -> GetQueryExecutionOutput:
        """Returns information about a single execution of a query if you have
        access to the workgroup in which the query ran. Each time a query
        executes, information about the query execution is saved with a unique
        ID.

        :param query_execution_id: The unique ID of the query execution.
        :returns: GetQueryExecutionOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("GetQueryResults")
    def get_query_results(
        self,
        context: RequestContext,
        query_execution_id: QueryExecutionId,
        next_token: Token = None,
        max_results: MaxQueryResults = None,
    ) -> GetQueryResultsOutput:
        """Streams the results of a single query execution specified by
        ``QueryExecutionId`` from the Athena query results location in Amazon
        S3. For more information, see `Working with query results, recent
        queries, and output
        files <https://docs.aws.amazon.com/athena/latest/ug/querying.html>`__ in
        the *Amazon Athena User Guide*. This request does not execute the query
        but returns results. Use StartQueryExecution to run a query.

        To stream query results successfully, the IAM principal with permission
        to call ``GetQueryResults`` also must have permissions to the Amazon S3
        ``GetObject`` action for the Athena query results location.

        IAM principals with permission to the Amazon S3 ``GetObject`` action for
        the query results location are able to retrieve query results from
        Amazon S3 even if permission to the ``GetQueryResults`` action is
        denied. To restrict user or role access, ensure that Amazon S3
        permissions to the Athena query location are denied.

        :param query_execution_id: The unique ID of the query execution.
        :param next_token: A token generated by the Athena service that specifies where to continue
        pagination if a previous request was truncated.
        :param max_results: The maximum number of results (rows) to return in this request.
        :returns: GetQueryResultsOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises TooManyRequestsException:
        """
        raise NotImplementedError

    @handler("GetQueryRuntimeStatistics")
    def get_query_runtime_statistics(
        self, context: RequestContext, query_execution_id: QueryExecutionId
    ) -> GetQueryRuntimeStatisticsOutput:
        """Returns query execution runtime statistics related to a single execution
        of a query if you have access to the workgroup in which the query ran.
        Query execution runtime statistics are returned only when
        QueryExecutionStatus$State is in a SUCCEEDED or FAILED state.
        Stage-level input and output row count and data size statistics are not
        shown when a query has row-level filters defined in Lake Formation.

        :param query_execution_id: The unique ID of the query execution.
        :returns: GetQueryRuntimeStatisticsOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("GetSession")
    def get_session(self, context: RequestContext, session_id: SessionId) -> GetSessionResponse:
        """Gets the full details of a previously created session, including the
        session status and configuration.

        :param session_id: The session ID.
        :returns: GetSessionResponse
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises ResourceNotFoundException:
        """
        raise NotImplementedError

    @handler("GetSessionStatus")
    def get_session_status(
        self, context: RequestContext, session_id: SessionId
    ) -> GetSessionStatusResponse:
        """Gets the current status of a session.

        :param session_id: The session ID.
        :returns: GetSessionStatusResponse
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises ResourceNotFoundException:
        """
        raise NotImplementedError

    @handler("GetTableMetadata")
    def get_table_metadata(
        self,
        context: RequestContext,
        catalog_name: CatalogNameString,
        database_name: NameString,
        table_name: NameString,
    ) -> GetTableMetadataOutput:
        """Returns table metadata for the specified catalog, database, and table.

        :param catalog_name: The name of the data catalog that contains the database and table
        metadata to return.
        :param database_name: The name of the database that contains the table metadata to return.
        :param table_name: The name of the table for which metadata is returned.
        :returns: GetTableMetadataOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises MetadataException:
        """
        raise NotImplementedError

    @handler("GetWorkGroup")
    def get_work_group(
        self, context: RequestContext, work_group: WorkGroupName
    ) -> GetWorkGroupOutput:
        """Returns information about the workgroup with the specified name.

        :param work_group: The name of the workgroup.
        :returns: GetWorkGroupOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("ImportNotebook", expand=False)
    def import_notebook(
        self, context: RequestContext, request: ImportNotebookInput
    ) -> ImportNotebookOutput:
        """Imports a single ``ipynb`` file to a Spark enabled workgroup. The
        maximum file size that can be imported is 10 megabytes. If an ``ipynb``
        file with the same name already exists in the workgroup, throws an
        error.

        :param work_group: The name of the Spark enabled workgroup to import the notebook to.
        :param name: The name of the notebook to import.
        :param payload: The notebook content to be imported.
        :param type: The notebook content type.
        :param client_request_token: A unique case-sensitive string used to ensure the request to import the
        notebook is idempotent (executes only once).
        :returns: ImportNotebookOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises TooManyRequestsException:
        """
        raise NotImplementedError

    @handler("ListApplicationDPUSizes")
    def list_application_dpu_sizes(
        self,
        context: RequestContext,
        max_results: MaxApplicationDPUSizesCount = None,
        next_token: Token = None,
    ) -> ListApplicationDPUSizesOutput:
        """Returns the supported DPU sizes for the supported application runtimes
        (for example, ``Athena notebook version 1``).

        :param max_results: Specifies the maximum number of results to return.
        :param next_token: A token generated by the Athena service that specifies where to continue
        pagination if a previous request was truncated.
        :returns: ListApplicationDPUSizesOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises TooManyRequestsException:
        """
        raise NotImplementedError

    @handler("ListCalculationExecutions")
    def list_calculation_executions(
        self,
        context: RequestContext,
        session_id: SessionId,
        state_filter: CalculationExecutionState = None,
        max_results: MaxCalculationsCount = None,
        next_token: SessionManagerToken = None,
    ) -> ListCalculationExecutionsResponse:
        """Lists the calculations that have been submitted to a session in
        descending order. Newer calculations are listed first; older
        calculations are listed later.

        :param session_id: The session ID.
        :param state_filter: A filter for a specific calculation execution state.
        :param max_results: The maximum number of calculation executions to return.
        :param next_token: A token generated by the Athena service that specifies where to continue
        pagination if a previous request was truncated.
        :returns: ListCalculationExecutionsResponse
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises ResourceNotFoundException:
        """
        raise NotImplementedError

    @handler("ListCapacityReservations")
    def list_capacity_reservations(
        self,
        context: RequestContext,
        next_token: Token = None,
        max_results: MaxCapacityReservationsCount = None,
    ) -> ListCapacityReservationsOutput:
        """Lists the capacity reservations for the current account.

        :param next_token: A token generated by the Athena service that specifies where to continue
        pagination if a previous request was truncated.
        :param max_results: Specifies the maximum number of results to return.
        :returns: ListCapacityReservationsOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("ListDataCatalogs")
    def list_data_catalogs(
        self,
        context: RequestContext,
        next_token: Token = None,
        max_results: MaxDataCatalogsCount = None,
    ) -> ListDataCatalogsOutput:
        """Lists the data catalogs in the current Amazon Web Services account.

        In the Athena console, data catalogs are listed as "data sources" on the
        **Data sources** page under the **Data source name** column.

        :param next_token: A token generated by the Athena service that specifies where to continue
        pagination if a previous request was truncated.
        :param max_results: Specifies the maximum number of data catalogs to return.
        :returns: ListDataCatalogsOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("ListDatabases")
    def list_databases(
        self,
        context: RequestContext,
        catalog_name: CatalogNameString,
        next_token: Token = None,
        max_results: MaxDatabasesCount = None,
    ) -> ListDatabasesOutput:
        """Lists the databases in the specified data catalog.

        :param catalog_name: The name of the data catalog that contains the databases to return.
        :param next_token: A token generated by the Athena service that specifies where to continue
        pagination if a previous request was truncated.
        :param max_results: Specifies the maximum number of results to return.
        :returns: ListDatabasesOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises MetadataException:
        """
        raise NotImplementedError

    @handler("ListEngineVersions")
    def list_engine_versions(
        self,
        context: RequestContext,
        next_token: Token = None,
        max_results: MaxEngineVersionsCount = None,
    ) -> ListEngineVersionsOutput:
        """Returns a list of engine versions that are available to choose from,
        including the Auto option.

        :param next_token: A token generated by the Athena service that specifies where to continue
        pagination if a previous request was truncated.
        :param max_results: The maximum number of engine versions to return in this request.
        :returns: ListEngineVersionsOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("ListExecutors")
    def list_executors(
        self,
        context: RequestContext,
        session_id: SessionId,
        executor_state_filter: ExecutorState = None,
        max_results: MaxListExecutorsCount = None,
        next_token: SessionManagerToken = None,
    ) -> ListExecutorsResponse:
        """Lists, in descending order, the executors that joined a session. Newer
        executors are listed first; older executors are listed later. The result
        can be optionally filtered by state.

        :param session_id: The session ID.
        :param executor_state_filter: A filter for a specific executor state.
        :param max_results: The maximum number of executors to return.
        :param next_token: A token generated by the Athena service that specifies where to continue
        pagination if a previous request was truncated.
        :returns: ListExecutorsResponse
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises ResourceNotFoundException:
        """
        raise NotImplementedError

    @handler("ListNamedQueries")
    def list_named_queries(
        self,
        context: RequestContext,
        next_token: Token = None,
        max_results: MaxNamedQueriesCount = None,
        work_group: WorkGroupName = None,
    ) -> ListNamedQueriesOutput:
        """Provides a list of available query IDs only for queries saved in the
        specified workgroup. Requires that you have access to the specified
        workgroup. If a workgroup is not specified, lists the saved queries for
        the primary workgroup.

        For code samples using the Amazon Web Services SDK for Java, see
        `Examples and Code
        Samples <http://docs.aws.amazon.com/athena/latest/ug/code-samples.html>`__
        in the *Amazon Athena User Guide*.

        :param next_token: A token generated by the Athena service that specifies where to continue
        pagination if a previous request was truncated.
        :param max_results: The maximum number of queries to return in this request.
        :param work_group: The name of the workgroup from which the named queries are being
        returned.
        :returns: ListNamedQueriesOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("ListNotebookMetadata")
    def list_notebook_metadata(
        self,
        context: RequestContext,
        work_group: WorkGroupName,
        filters: FilterDefinition = None,
        next_token: Token = None,
        max_results: MaxNotebooksCount = None,
    ) -> ListNotebookMetadataOutput:
        """Displays the notebook files for the specified workgroup in paginated
        format.

        :param work_group: The name of the Spark enabled workgroup to retrieve notebook metadata
        for.
        :param filters: Search filter string.
        :param next_token: A token generated by the Athena service that specifies where to continue
        pagination if a previous request was truncated.
        :param max_results: Specifies the maximum number of results to return.
        :returns: ListNotebookMetadataOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises TooManyRequestsException:
        """
        raise NotImplementedError

    @handler("ListNotebookSessions")
    def list_notebook_sessions(
        self,
        context: RequestContext,
        notebook_id: NotebookId,
        max_results: MaxSessionsCount = None,
        next_token: Token = None,
    ) -> ListNotebookSessionsResponse:
        """Lists, in descending order, the sessions that have been created in a
        notebook that are in an active state like ``CREATING``, ``CREATED``,
        ``IDLE`` or ``BUSY``. Newer sessions are listed first; older sessions
        are listed later.

        :param notebook_id: The ID of the notebook to list sessions for.
        :param max_results: The maximum number of notebook sessions to return.
        :param next_token: A token generated by the Athena service that specifies where to continue
        pagination if a previous request was truncated.
        :returns: ListNotebookSessionsResponse
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises ResourceNotFoundException:
        """
        raise NotImplementedError

    @handler("ListPreparedStatements")
    def list_prepared_statements(
        self,
        context: RequestContext,
        work_group: WorkGroupName,
        next_token: Token = None,
        max_results: MaxPreparedStatementsCount = None,
    ) -> ListPreparedStatementsOutput:
        """Lists the prepared statements in the specified workgroup.

        :param work_group: The workgroup to list the prepared statements for.
        :param next_token: A token generated by the Athena service that specifies where to continue
        pagination if a previous request was truncated.
        :param max_results: The maximum number of results to return in this request.
        :returns: ListPreparedStatementsOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("ListQueryExecutions")
    def list_query_executions(
        self,
        context: RequestContext,
        next_token: Token = None,
        max_results: MaxQueryExecutionsCount = None,
        work_group: WorkGroupName = None,
    ) -> ListQueryExecutionsOutput:
        """Provides a list of available query execution IDs for the queries in the
        specified workgroup. If a workgroup is not specified, returns a list of
        query execution IDs for the primary workgroup. Requires you to have
        access to the workgroup in which the queries ran.

        For code samples using the Amazon Web Services SDK for Java, see
        `Examples and Code
        Samples <http://docs.aws.amazon.com/athena/latest/ug/code-samples.html>`__
        in the *Amazon Athena User Guide*.

        :param next_token: A token generated by the Athena service that specifies where to continue
        pagination if a previous request was truncated.
        :param max_results: The maximum number of query executions to return in this request.
        :param work_group: The name of the workgroup from which queries are being returned.
        :returns: ListQueryExecutionsOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("ListSessions")
    def list_sessions(
        self,
        context: RequestContext,
        work_group: WorkGroupName,
        state_filter: SessionState = None,
        max_results: MaxSessionsCount = None,
        next_token: SessionManagerToken = None,
    ) -> ListSessionsResponse:
        """Lists the sessions in a workgroup that are in an active state like
        ``CREATING``, ``CREATED``, ``IDLE``, or ``BUSY``. Newer sessions are
        listed first; older sessions are listed later.

        :param work_group: The workgroup to which the session belongs.
        :param state_filter: A filter for a specific session state.
        :param max_results: The maximum number of sessions to return.
        :param next_token: A token generated by the Athena service that specifies where to continue
        pagination if a previous request was truncated.
        :returns: ListSessionsResponse
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises ResourceNotFoundException:
        """
        raise NotImplementedError

    @handler("ListTableMetadata")
    def list_table_metadata(
        self,
        context: RequestContext,
        catalog_name: CatalogNameString,
        database_name: NameString,
        expression: ExpressionString = None,
        next_token: Token = None,
        max_results: MaxTableMetadataCount = None,
    ) -> ListTableMetadataOutput:
        """Lists the metadata for the tables in the specified data catalog
        database.

        :param catalog_name: The name of the data catalog for which table metadata should be
        returned.
        :param database_name: The name of the database for which table metadata should be returned.
        :param expression: A regex filter that pattern-matches table names.
        :param next_token: A token generated by the Athena service that specifies where to continue
        pagination if a previous request was truncated.
        :param max_results: Specifies the maximum number of results to return.
        :returns: ListTableMetadataOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises MetadataException:
        """
        raise NotImplementedError

    @handler("ListTagsForResource")
    def list_tags_for_resource(
        self,
        context: RequestContext,
        resource_arn: AmazonResourceName,
        next_token: Token = None,
        max_results: MaxTagsCount = None,
    ) -> ListTagsForResourceOutput:
        """Lists the tags associated with an Athena resource.

        :param resource_arn: Lists the tags for the resource with the specified ARN.
        :param next_token: The token for the next set of results, or null if there are no
        additional results for this request, where the request lists the tags
        for the resource with the specified ARN.
        :param max_results: The maximum number of results to be returned per request that lists the
        tags for the resource.
        :returns: ListTagsForResourceOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises ResourceNotFoundException:
        """
        raise NotImplementedError

    @handler("ListWorkGroups")
    def list_work_groups(
        self,
        context: RequestContext,
        next_token: Token = None,
        max_results: MaxWorkGroupsCount = None,
    ) -> ListWorkGroupsOutput:
        """Lists available workgroups for the account.

        :param next_token: A token generated by the Athena service that specifies where to continue
        pagination if a previous request was truncated.
        :param max_results: The maximum number of workgroups to return in this request.
        :returns: ListWorkGroupsOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("PutCapacityAssignmentConfiguration")
    def put_capacity_assignment_configuration(
        self,
        context: RequestContext,
        capacity_reservation_name: CapacityReservationName,
        capacity_assignments: CapacityAssignmentsList,
    ) -> PutCapacityAssignmentConfigurationOutput:
        """Puts a new capacity assignment configuration for a specified capacity
        reservation. If a capacity assignment configuration already exists for
        the capacity reservation, replaces the existing capacity assignment
        configuration.

        :param capacity_reservation_name: The name of the capacity reservation to put a capacity assignment
        configuration for.
        :param capacity_assignments: The list of assignments for the capacity assignment configuration.
        :returns: PutCapacityAssignmentConfigurationOutput
        :raises InvalidRequestException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("StartCalculationExecution")
    def start_calculation_execution(
        self,
        context: RequestContext,
        session_id: SessionId,
        description: DescriptionString = None,
        calculation_configuration: CalculationConfiguration = None,
        code_block: CodeBlock = None,
        client_request_token: IdempotencyToken = None,
    ) -> StartCalculationExecutionResponse:
        """Submits calculations for execution within a session. You can supply the
        code to run as an inline code block within the request.

        :param session_id: The session ID.
        :param description: A description of the calculation.
        :param calculation_configuration: Contains configuration information for the calculation.
        :param code_block: A string that contains the code of the calculation.
        :param client_request_token: A unique case-sensitive string used to ensure the request to create the
        calculation is idempotent (executes only once).
        :returns: StartCalculationExecutionResponse
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises ResourceNotFoundException:
        """
        raise NotImplementedError

    @handler("StartQueryExecution")
    def start_query_execution(
        self,
        context: RequestContext,
        query_string: QueryString,
        client_request_token: IdempotencyToken = None,
        query_execution_context: QueryExecutionContext = None,
        result_configuration: ResultConfiguration = None,
        work_group: WorkGroupName = None,
        execution_parameters: ExecutionParameters = None,
        result_reuse_configuration: ResultReuseConfiguration = None,
    ) -> StartQueryExecutionOutput:
        """Runs the SQL query statements contained in the ``Query``. Requires you
        to have access to the workgroup in which the query ran. Running queries
        against an external catalog requires GetDataCatalog permission to the
        catalog. For code samples using the Amazon Web Services SDK for Java,
        see `Examples and Code
        Samples <http://docs.aws.amazon.com/athena/latest/ug/code-samples.html>`__
        in the *Amazon Athena User Guide*.

        :param query_string: The SQL query statements to be executed.
        :param client_request_token: A unique case-sensitive string used to ensure the request to create the
        query is idempotent (executes only once).
        :param query_execution_context: The database within which the query executes.
        :param result_configuration: Specifies information about where and how to save the results of the
        query execution.
        :param work_group: The name of the workgroup in which the query is being started.
        :param execution_parameters: A list of values for the parameters in a query.
        :param result_reuse_configuration: Specifies the query result reuse behavior for the query.
        :returns: StartQueryExecutionOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises TooManyRequestsException:
        """
        raise NotImplementedError

    @handler("StartSession")
    def start_session(
        self,
        context: RequestContext,
        work_group: WorkGroupName,
        engine_configuration: EngineConfiguration,
        description: DescriptionString = None,
        notebook_version: NameString = None,
        session_idle_timeout_in_minutes: SessionIdleTimeoutInMinutes = None,
        client_request_token: IdempotencyToken = None,
    ) -> StartSessionResponse:
        """Creates a session for running calculations within a workgroup. The
        session is ready when it reaches an ``IDLE`` state.

        :param work_group: The workgroup to which the session belongs.
        :param engine_configuration: Contains engine data processing unit (DPU) configuration settings and
        parameter mappings.
        :param description: The session description.
        :param notebook_version: The notebook version.
        :param session_idle_timeout_in_minutes: The idle timeout in minutes for the session.
        :param client_request_token: A unique case-sensitive string used to ensure the request to create the
        session is idempotent (executes only once).
        :returns: StartSessionResponse
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises ResourceNotFoundException:
        :raises SessionAlreadyExistsException:
        :raises TooManyRequestsException:
        """
        raise NotImplementedError

    @handler("StopCalculationExecution")
    def stop_calculation_execution(
        self, context: RequestContext, calculation_execution_id: CalculationExecutionId
    ) -> StopCalculationExecutionResponse:
        """Requests the cancellation of a calculation. A
        ``StopCalculationExecution`` call on a calculation that is already in a
        terminal state (for example, ``STOPPED``, ``FAILED``, or ``COMPLETED``)
        succeeds but has no effect.

        Cancelling a calculation is done on a best effort basis. If a
        calculation cannot be cancelled, you can be charged for its completion.
        If you are concerned about being charged for a calculation that cannot
        be cancelled, consider terminating the session in which the calculation
        is running.

        :param calculation_execution_id: The calculation execution UUID.
        :returns: StopCalculationExecutionResponse
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises ResourceNotFoundException:
        """
        raise NotImplementedError

    @handler("StopQueryExecution")
    def stop_query_execution(
        self, context: RequestContext, query_execution_id: QueryExecutionId
    ) -> StopQueryExecutionOutput:
        """Stops a query execution. Requires you to have access to the workgroup in
        which the query ran.

        For code samples using the Amazon Web Services SDK for Java, see
        `Examples and Code
        Samples <http://docs.aws.amazon.com/athena/latest/ug/code-samples.html>`__
        in the *Amazon Athena User Guide*.

        :param query_execution_id: The unique ID of the query execution to stop.
        :returns: StopQueryExecutionOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("TagResource")
    def tag_resource(
        self, context: RequestContext, resource_arn: AmazonResourceName, tags: TagList
    ) -> TagResourceOutput:
        """Adds one or more tags to an Athena resource. A tag is a label that you
        assign to a resource. Each tag consists of a key and an optional value,
        both of which you define. For example, you can use tags to categorize
        Athena workgroups, data catalogs, or capacity reservations by purpose,
        owner, or environment. Use a consistent set of tag keys to make it
        easier to search and filter the resources in your account. For best
        practices, see `Tagging Best
        Practices <https://docs.aws.amazon.com/whitepapers/latest/tagging-best-practices/tagging-best-practices.html>`__.
        Tag keys can be from 1 to 128 UTF-8 Unicode characters, and tag values
        can be from 0 to 256 UTF-8 Unicode characters. Tags can use letters and
        numbers representable in UTF-8, and the following characters: + - = . _
        : / @. Tag keys and values are case-sensitive. Tag keys must be unique
        per resource. If you specify more than one tag, separate them by commas.

        :param resource_arn: Specifies the ARN of the Athena resource to which tags are to be added.
        :param tags: A collection of one or more tags, separated by commas, to be added to an
        Athena resource.
        :returns: TagResourceOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises ResourceNotFoundException:
        """
        raise NotImplementedError

    @handler("TerminateSession")
    def terminate_session(
        self, context: RequestContext, session_id: SessionId
    ) -> TerminateSessionResponse:
        """Terminates an active session. A ``TerminateSession`` call on a session
        that is already inactive (for example, in a ``FAILED``, ``TERMINATED``
        or ``TERMINATING`` state) succeeds but has no effect. Calculations
        running in the session when ``TerminateSession`` is called are
        forcefully stopped, but may display as ``FAILED`` instead of
        ``STOPPED``.

        :param session_id: The session ID.
        :returns: TerminateSessionResponse
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises ResourceNotFoundException:
        """
        raise NotImplementedError

    @handler("UntagResource")
    def untag_resource(
        self, context: RequestContext, resource_arn: AmazonResourceName, tag_keys: TagKeyList
    ) -> UntagResourceOutput:
        """Removes one or more tags from an Athena resource.

        :param resource_arn: Specifies the ARN of the resource from which tags are to be removed.
        :param tag_keys: A comma-separated list of one or more tag keys whose tags are to be
        removed from the specified resource.
        :returns: UntagResourceOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises ResourceNotFoundException:
        """
        raise NotImplementedError

    @handler("UpdateCapacityReservation")
    def update_capacity_reservation(
        self, context: RequestContext, target_dpus: TargetDpusInteger, name: CapacityReservationName
    ) -> UpdateCapacityReservationOutput:
        """Updates the number of requested data processing units for the capacity
        reservation with the specified name.

        :param target_dpus: The new number of requested data processing units.
        :param name: The name of the capacity reservation.
        :returns: UpdateCapacityReservationOutput
        :raises InvalidRequestException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("UpdateDataCatalog", expand=False)
    def update_data_catalog(
        self, context: RequestContext, request: UpdateDataCatalogInput
    ) -> UpdateDataCatalogOutput:
        """Updates the data catalog that has the specified name.

        :param name: The name of the data catalog to update.
        :param type: Specifies the type of data catalog to update.
        :param description: New or modified text that describes the data catalog.
        :param parameters: Specifies the Lambda function or functions to use for updating the data
        catalog.
        :returns: UpdateDataCatalogOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("UpdateNamedQuery")
    def update_named_query(
        self,
        context: RequestContext,
        named_query_id: NamedQueryId,
        name: NameString,
        query_string: QueryString,
        description: NamedQueryDescriptionString = None,
    ) -> UpdateNamedQueryOutput:
        """Updates a NamedQuery object. The database or workgroup cannot be
        updated.

        :param named_query_id: The unique identifier (UUID) of the query.
        :param name: The name of the query.
        :param query_string: The contents of the query with all query statements.
        :param description: The query description.
        :returns: UpdateNamedQueryOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("UpdateNotebook", expand=False)
    def update_notebook(
        self, context: RequestContext, request: UpdateNotebookInput
    ) -> UpdateNotebookOutput:
        """Updates the contents of a Spark notebook.

        :param notebook_id: The ID of the notebook to update.
        :param payload: The updated content for the notebook.
        :param type: The notebook content type.
        :param session_id: The active notebook session ID.
        :param client_request_token: A unique case-sensitive string used to ensure the request to create the
        notebook is idempotent (executes only once).
        :returns: UpdateNotebookOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises TooManyRequestsException:
        """
        raise NotImplementedError

    @handler("UpdateNotebookMetadata")
    def update_notebook_metadata(
        self,
        context: RequestContext,
        notebook_id: NotebookId,
        name: NotebookName,
        client_request_token: ClientRequestToken = None,
    ) -> UpdateNotebookMetadataOutput:
        """Updates the metadata for a notebook.

        :param notebook_id: The ID of the notebook to update the metadata for.
        :param name: The name to update the notebook to.
        :param client_request_token: A unique case-sensitive string used to ensure the request to create the
        notebook is idempotent (executes only once).
        :returns: UpdateNotebookMetadataOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises TooManyRequestsException:
        """
        raise NotImplementedError

    @handler("UpdatePreparedStatement")
    def update_prepared_statement(
        self,
        context: RequestContext,
        statement_name: StatementName,
        work_group: WorkGroupName,
        query_statement: QueryString,
        description: DescriptionString = None,
    ) -> UpdatePreparedStatementOutput:
        """Updates a prepared statement.

        :param statement_name: The name of the prepared statement.
        :param work_group: The workgroup for the prepared statement.
        :param query_statement: The query string for the prepared statement.
        :param description: The description of the prepared statement.
        :returns: UpdatePreparedStatementOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        :raises ResourceNotFoundException:
        """
        raise NotImplementedError

    @handler("UpdateWorkGroup")
    def update_work_group(
        self,
        context: RequestContext,
        work_group: WorkGroupName,
        description: WorkGroupDescriptionString = None,
        configuration_updates: WorkGroupConfigurationUpdates = None,
        state: WorkGroupState = None,
    ) -> UpdateWorkGroupOutput:
        """Updates the workgroup with the specified name. The workgroup's name
        cannot be changed. Only ``ConfigurationUpdates`` can be specified.

        :param work_group: The specified workgroup that will be updated.
        :param description: The workgroup description.
        :param configuration_updates: Contains configuration updates for an Athena SQL workgroup.
        :param state: The workgroup state that will be updated for the given workgroup.
        :returns: UpdateWorkGroupOutput
        :raises InternalServerException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError
