from datetime import datetime
from typing import Dict, List, Optional, TypedDict

from localstack.aws.api import RequestContext, ServiceException, ServiceRequest, handler

ApplicationDescription = str
ApplicationMaintenanceWindowEndTime = str
ApplicationMaintenanceWindowStartTime = str
ApplicationName = str
AuthorizedUrl = str
BasePath = str
BooleanObject = bool
BucketARN = str
CodeMD5 = str
ConditionalToken = str
DatabaseARN = str
ErrorMessage = str
FileKey = str
Id = str
InAppStreamName = str
InAppTableName = str
InputParallelismCount = int
JobPlanDescription = str
KinesisAnalyticsARN = str
ListApplicationVersionsInputLimit = int
ListApplicationsInputLimit = int
ListSnapshotsInputLimit = int
LogStreamARN = str
MavenArtifactId = str
MavenGroupId = str
MavenVersion = str
NextToken = str
ObjectVersion = str
Parallelism = int
ParallelismPerKPU = int
ParsedInputRecordField = str
ProcessedInputRecord = str
PropertyKey = str
PropertyValue = str
RawInputRecord = str
RecordColumnDelimiter = str
RecordColumnMapping = str
RecordColumnName = str
RecordColumnSqlType = str
RecordEncoding = str
RecordRowDelimiter = str
RecordRowPath = str
ResourceARN = str
RoleARN = str
SecurityGroupId = str
SnapshotName = str
SubnetId = str
TagKey = str
TagValue = str
TextContent = str
VpcId = str


class ApplicationMode(str):
    STREAMING = "STREAMING"
    INTERACTIVE = "INTERACTIVE"


class ApplicationRestoreType(str):
    SKIP_RESTORE_FROM_SNAPSHOT = "SKIP_RESTORE_FROM_SNAPSHOT"
    RESTORE_FROM_LATEST_SNAPSHOT = "RESTORE_FROM_LATEST_SNAPSHOT"
    RESTORE_FROM_CUSTOM_SNAPSHOT = "RESTORE_FROM_CUSTOM_SNAPSHOT"


class ApplicationStatus(str):
    DELETING = "DELETING"
    STARTING = "STARTING"
    STOPPING = "STOPPING"
    READY = "READY"
    RUNNING = "RUNNING"
    UPDATING = "UPDATING"
    AUTOSCALING = "AUTOSCALING"
    FORCE_STOPPING = "FORCE_STOPPING"
    ROLLING_BACK = "ROLLING_BACK"
    MAINTENANCE = "MAINTENANCE"
    ROLLED_BACK = "ROLLED_BACK"


class ArtifactType(str):
    UDF = "UDF"
    DEPENDENCY_JAR = "DEPENDENCY_JAR"


class CodeContentType(str):
    PLAINTEXT = "PLAINTEXT"
    ZIPFILE = "ZIPFILE"


class ConfigurationType(str):
    DEFAULT = "DEFAULT"
    CUSTOM = "CUSTOM"


class InputStartingPosition(str):
    NOW = "NOW"
    TRIM_HORIZON = "TRIM_HORIZON"
    LAST_STOPPED_POINT = "LAST_STOPPED_POINT"


class LogLevel(str):
    INFO = "INFO"
    WARN = "WARN"
    ERROR = "ERROR"
    DEBUG = "DEBUG"


class MetricsLevel(str):
    APPLICATION = "APPLICATION"
    TASK = "TASK"
    OPERATOR = "OPERATOR"
    PARALLELISM = "PARALLELISM"


class RecordFormatType(str):
    JSON = "JSON"
    CSV = "CSV"


class RuntimeEnvironment(str):
    SQL_1_0 = "SQL-1_0"
    FLINK_1_6 = "FLINK-1_6"
    FLINK_1_8 = "FLINK-1_8"
    ZEPPELIN_FLINK_1_0 = "ZEPPELIN-FLINK-1_0"
    FLINK_1_11 = "FLINK-1_11"
    FLINK_1_13 = "FLINK-1_13"
    ZEPPELIN_FLINK_2_0 = "ZEPPELIN-FLINK-2_0"
    FLINK_1_15 = "FLINK-1_15"
    ZEPPELIN_FLINK_3_0 = "ZEPPELIN-FLINK-3_0"


class SnapshotStatus(str):
    CREATING = "CREATING"
    READY = "READY"
    DELETING = "DELETING"
    FAILED = "FAILED"


class UrlType(str):
    FLINK_DASHBOARD_URL = "FLINK_DASHBOARD_URL"
    ZEPPELIN_UI_URL = "ZEPPELIN_UI_URL"


class CodeValidationException(ServiceException):
    """The user-provided application code (query) is not valid. This can be a
    simple syntax error.
    """

    code: str = "CodeValidationException"
    sender_fault: bool = False
    status_code: int = 400


class ConcurrentModificationException(ServiceException):
    """Exception thrown as a result of concurrent modifications to an
    application. This error can be the result of attempting to modify an
    application without using the current application ID.
    """

    code: str = "ConcurrentModificationException"
    sender_fault: bool = False
    status_code: int = 400


class InvalidApplicationConfigurationException(ServiceException):
    """The user-provided application configuration is not valid."""

    code: str = "InvalidApplicationConfigurationException"
    sender_fault: bool = False
    status_code: int = 400


class InvalidArgumentException(ServiceException):
    """The specified input parameter value is not valid."""

    code: str = "InvalidArgumentException"
    sender_fault: bool = False
    status_code: int = 400


class InvalidRequestException(ServiceException):
    """The request JSON is not valid for the operation."""

    code: str = "InvalidRequestException"
    sender_fault: bool = False
    status_code: int = 400


class LimitExceededException(ServiceException):
    """The number of allowed resources has been exceeded."""

    code: str = "LimitExceededException"
    sender_fault: bool = False
    status_code: int = 400


class ResourceInUseException(ServiceException):
    """The application is not available for this operation."""

    code: str = "ResourceInUseException"
    sender_fault: bool = False
    status_code: int = 400


class ResourceNotFoundException(ServiceException):
    """Specified application can't be found."""

    code: str = "ResourceNotFoundException"
    sender_fault: bool = False
    status_code: int = 400


class ResourceProvisionedThroughputExceededException(ServiceException):
    """Discovery failed to get a record from the streaming source because of
    the Kinesis Streams ``ProvisionedThroughputExceededException``. For more
    information, see
    `GetRecords <http://docs.aws.amazon.com/kinesis/latest/APIReference/API_GetRecords.html>`__
    in the Amazon Kinesis Streams API Reference.
    """

    code: str = "ResourceProvisionedThroughputExceededException"
    sender_fault: bool = False
    status_code: int = 400


class ServiceUnavailableException(ServiceException):
    """The service cannot complete the request."""

    code: str = "ServiceUnavailableException"
    sender_fault: bool = False
    status_code: int = 400


class TooManyTagsException(ServiceException):
    """Application created with too many tags, or too many tags added to an
    application. Note that the maximum number of application tags includes
    system tags. The maximum number of user-defined application tags is 50.
    """

    code: str = "TooManyTagsException"
    sender_fault: bool = False
    status_code: int = 400


ProcessedInputRecords = List[ProcessedInputRecord]
RawInputRecords = List[RawInputRecord]


class UnableToDetectSchemaException(ServiceException):
    """The data format is not valid. Kinesis Data Analytics cannot detect the
    schema for the given streaming source.
    """

    code: str = "UnableToDetectSchemaException"
    sender_fault: bool = False
    status_code: int = 400
    RawInputRecords: Optional[RawInputRecords]
    ProcessedInputRecords: Optional[ProcessedInputRecords]


class UnsupportedOperationException(ServiceException):
    """The request was rejected because a specified parameter is not supported
    or a specified resource is not valid for this operation.
    """

    code: str = "UnsupportedOperationException"
    sender_fault: bool = False
    status_code: int = 400


class CloudWatchLoggingOption(TypedDict, total=False):
    """Provides a description of Amazon CloudWatch logging options, including
    the log stream Amazon Resource Name (ARN).
    """

    LogStreamARN: LogStreamARN


ApplicationVersionId = int


class AddApplicationCloudWatchLoggingOptionRequest(ServiceRequest):
    ApplicationName: ApplicationName
    CurrentApplicationVersionId: Optional[ApplicationVersionId]
    CloudWatchLoggingOption: CloudWatchLoggingOption
    ConditionalToken: Optional[ConditionalToken]


class CloudWatchLoggingOptionDescription(TypedDict, total=False):
    """Describes the Amazon CloudWatch logging option."""

    CloudWatchLoggingOptionId: Optional[Id]
    LogStreamARN: LogStreamARN
    RoleARN: Optional[RoleARN]


CloudWatchLoggingOptionDescriptions = List[CloudWatchLoggingOptionDescription]


class AddApplicationCloudWatchLoggingOptionResponse(TypedDict, total=False):
    ApplicationARN: Optional[ResourceARN]
    ApplicationVersionId: Optional[ApplicationVersionId]
    CloudWatchLoggingOptionDescriptions: Optional[CloudWatchLoggingOptionDescriptions]


class InputLambdaProcessor(TypedDict, total=False):
    """An object that contains the Amazon Resource Name (ARN) of the Amazon
    Lambda function that is used to preprocess records in the stream in a
    SQL-based Kinesis Data Analytics application.
    """

    ResourceARN: ResourceARN


class InputProcessingConfiguration(TypedDict, total=False):
    """For a SQL-based Kinesis Data Analytics application, describes a
    processor that is used to preprocess the records in the stream before
    being processed by your application code. Currently, the only input
    processor available is `Amazon
    Lambda <https://docs.aws.amazon.com/lambda/>`__.
    """

    InputLambdaProcessor: InputLambdaProcessor


class AddApplicationInputProcessingConfigurationRequest(ServiceRequest):
    ApplicationName: ApplicationName
    CurrentApplicationVersionId: ApplicationVersionId
    InputId: Id
    InputProcessingConfiguration: InputProcessingConfiguration


class InputLambdaProcessorDescription(TypedDict, total=False):
    """For a SQL-based Kinesis Data Analytics application, an object that
    contains the Amazon Resource Name (ARN) of the Amazon Lambda function
    that is used to preprocess records in the stream.
    """

    ResourceARN: ResourceARN
    RoleARN: Optional[RoleARN]


class InputProcessingConfigurationDescription(TypedDict, total=False):
    """For a SQL-based Kinesis Data Analytics application, provides the
    configuration information about an input processor. Currently, the only
    input processor available is `Amazon
    Lambda <https://docs.aws.amazon.com/lambda/>`__.
    """

    InputLambdaProcessorDescription: Optional[InputLambdaProcessorDescription]


class AddApplicationInputProcessingConfigurationResponse(TypedDict, total=False):
    ApplicationARN: Optional[ResourceARN]
    ApplicationVersionId: Optional[ApplicationVersionId]
    InputId: Optional[Id]
    InputProcessingConfigurationDescription: Optional[InputProcessingConfigurationDescription]


class RecordColumn(TypedDict, total=False):
    """For a SQL-based Kinesis Data Analytics application, describes the
    mapping of each data element in the streaming source to the
    corresponding column in the in-application stream.

    Also used to describe the format of the reference data source.
    """

    Name: RecordColumnName
    Mapping: Optional[RecordColumnMapping]
    SqlType: RecordColumnSqlType


RecordColumns = List[RecordColumn]


class CSVMappingParameters(TypedDict, total=False):
    """For a SQL-based Kinesis Data Analytics application, provides additional
    mapping information when the record format uses delimiters, such as CSV.
    For example, the following sample records use CSV format, where the
    records use the *'\\n'* as the row delimiter and a comma (",") as the
    column delimiter:

    ``"name1", "address1"``

    ``"name2", "address2"``
    """

    RecordRowDelimiter: RecordRowDelimiter
    RecordColumnDelimiter: RecordColumnDelimiter


class JSONMappingParameters(TypedDict, total=False):
    """For a SQL-based Kinesis Data Analytics application, provides additional
    mapping information when JSON is the record format on the streaming
    source.
    """

    RecordRowPath: RecordRowPath


class MappingParameters(TypedDict, total=False):
    """When you configure a SQL-based Kinesis Data Analytics application's
    input at the time of creating or updating an application, provides
    additional mapping information specific to the record format (such as
    JSON, CSV, or record fields delimited by some delimiter) on the
    streaming source.
    """

    JSONMappingParameters: Optional[JSONMappingParameters]
    CSVMappingParameters: Optional[CSVMappingParameters]


class RecordFormat(TypedDict, total=False):
    """For a SQL-based Kinesis Data Analytics application, describes the record
    format and relevant mapping information that should be applied to
    schematize the records on the stream.
    """

    RecordFormatType: RecordFormatType
    MappingParameters: Optional[MappingParameters]


class SourceSchema(TypedDict, total=False):
    """For a SQL-based Kinesis Data Analytics application, describes the format
    of the data in the streaming source, and how each data element maps to
    corresponding columns created in the in-application stream.
    """

    RecordFormat: RecordFormat
    RecordEncoding: Optional[RecordEncoding]
    RecordColumns: RecordColumns


class InputParallelism(TypedDict, total=False):
    """For a SQL-based Kinesis Data Analytics application, describes the number
    of in-application streams to create for a given streaming source.
    """

    Count: Optional[InputParallelismCount]


class KinesisFirehoseInput(TypedDict, total=False):
    """For a SQL-based Kinesis Data Analytics application, identifies a Kinesis
    Data Firehose delivery stream as the streaming source. You provide the
    delivery stream's Amazon Resource Name (ARN).
    """

    ResourceARN: ResourceARN


class KinesisStreamsInput(TypedDict, total=False):
    """Identifies a Kinesis data stream as the streaming source. You provide
    the stream's Amazon Resource Name (ARN).
    """

    ResourceARN: ResourceARN


class Input(TypedDict, total=False):
    """When you configure the application input for a SQL-based Kinesis Data
    Analytics application, you specify the streaming source, the
    in-application stream name that is created, and the mapping between the
    two.
    """

    NamePrefix: InAppStreamName
    InputProcessingConfiguration: Optional[InputProcessingConfiguration]
    KinesisStreamsInput: Optional[KinesisStreamsInput]
    KinesisFirehoseInput: Optional[KinesisFirehoseInput]
    InputParallelism: Optional[InputParallelism]
    InputSchema: SourceSchema


class AddApplicationInputRequest(ServiceRequest):
    ApplicationName: ApplicationName
    CurrentApplicationVersionId: ApplicationVersionId
    Input: Input


class InputStartingPositionConfiguration(TypedDict, total=False):
    """Describes the point at which the application reads from the streaming
    source.
    """

    InputStartingPosition: Optional[InputStartingPosition]


class KinesisFirehoseInputDescription(TypedDict, total=False):
    """Describes the Amazon Kinesis Data Firehose delivery stream that is
    configured as the streaming source in the application input
    configuration.
    """

    ResourceARN: ResourceARN
    RoleARN: Optional[RoleARN]


class KinesisStreamsInputDescription(TypedDict, total=False):
    """For a SQL-based Kinesis Data Analytics application, describes the
    Kinesis data stream that is configured as the streaming source in the
    application input configuration.
    """

    ResourceARN: ResourceARN
    RoleARN: Optional[RoleARN]


InAppStreamNames = List[InAppStreamName]


class InputDescription(TypedDict, total=False):
    """Describes the application input configuration for a SQL-based Kinesis
    Data Analytics application.
    """

    InputId: Optional[Id]
    NamePrefix: Optional[InAppStreamName]
    InAppStreamNames: Optional[InAppStreamNames]
    InputProcessingConfigurationDescription: Optional[InputProcessingConfigurationDescription]
    KinesisStreamsInputDescription: Optional[KinesisStreamsInputDescription]
    KinesisFirehoseInputDescription: Optional[KinesisFirehoseInputDescription]
    InputSchema: Optional[SourceSchema]
    InputParallelism: Optional[InputParallelism]
    InputStartingPositionConfiguration: Optional[InputStartingPositionConfiguration]


InputDescriptions = List[InputDescription]


class AddApplicationInputResponse(TypedDict, total=False):
    ApplicationARN: Optional[ResourceARN]
    ApplicationVersionId: Optional[ApplicationVersionId]
    InputDescriptions: Optional[InputDescriptions]


class DestinationSchema(TypedDict, total=False):
    """Describes the data format when records are written to the destination in
    a SQL-based Kinesis Data Analytics application.
    """

    RecordFormatType: RecordFormatType


class LambdaOutput(TypedDict, total=False):
    """When you configure a SQL-based Kinesis Data Analytics application's
    output, identifies an Amazon Lambda function as the destination. You
    provide the function Amazon Resource Name (ARN) of the Lambda function.
    """

    ResourceARN: ResourceARN


class KinesisFirehoseOutput(TypedDict, total=False):
    """For a SQL-based Kinesis Data Analytics application, when configuring
    application output, identifies a Kinesis Data Firehose delivery stream
    as the destination. You provide the stream Amazon Resource Name (ARN) of
    the delivery stream.
    """

    ResourceARN: ResourceARN


class KinesisStreamsOutput(TypedDict, total=False):
    """When you configure a SQL-based Kinesis Data Analytics application's
    output, identifies a Kinesis data stream as the destination. You provide
    the stream Amazon Resource Name (ARN).
    """

    ResourceARN: ResourceARN


class Output(TypedDict, total=False):
    """Describes a SQL-based Kinesis Data Analytics application's output
    configuration, in which you identify an in-application stream and a
    destination where you want the in-application stream data to be written.
    The destination can be a Kinesis data stream or a Kinesis Data Firehose
    delivery stream.
    """

    Name: InAppStreamName
    KinesisStreamsOutput: Optional[KinesisStreamsOutput]
    KinesisFirehoseOutput: Optional[KinesisFirehoseOutput]
    LambdaOutput: Optional[LambdaOutput]
    DestinationSchema: DestinationSchema


class AddApplicationOutputRequest(ServiceRequest):
    ApplicationName: ApplicationName
    CurrentApplicationVersionId: ApplicationVersionId
    Output: Output


class LambdaOutputDescription(TypedDict, total=False):
    """For a SQL-based Kinesis Data Analytics application's output, describes
    the Amazon Lambda function that is configured as its destination.
    """

    ResourceARN: ResourceARN
    RoleARN: Optional[RoleARN]


class KinesisFirehoseOutputDescription(TypedDict, total=False):
    """For a SQL-based Kinesis Data Analytics application's output, describes
    the Kinesis Data Firehose delivery stream that is configured as its
    destination.
    """

    ResourceARN: ResourceARN
    RoleARN: Optional[RoleARN]


class KinesisStreamsOutputDescription(TypedDict, total=False):
    """For an SQL-based Kinesis Data Analytics application's output, describes
    the Kinesis data stream that is configured as its destination.
    """

    ResourceARN: ResourceARN
    RoleARN: Optional[RoleARN]


class OutputDescription(TypedDict, total=False):
    """For a SQL-based Kinesis Data Analytics application, describes the
    application output configuration, which includes the in-application
    stream name and the destination where the stream data is written. The
    destination can be a Kinesis data stream or a Kinesis Data Firehose
    delivery stream.
    """

    OutputId: Optional[Id]
    Name: Optional[InAppStreamName]
    KinesisStreamsOutputDescription: Optional[KinesisStreamsOutputDescription]
    KinesisFirehoseOutputDescription: Optional[KinesisFirehoseOutputDescription]
    LambdaOutputDescription: Optional[LambdaOutputDescription]
    DestinationSchema: Optional[DestinationSchema]


OutputDescriptions = List[OutputDescription]


class AddApplicationOutputResponse(TypedDict, total=False):
    ApplicationARN: Optional[ResourceARN]
    ApplicationVersionId: Optional[ApplicationVersionId]
    OutputDescriptions: Optional[OutputDescriptions]


class S3ReferenceDataSource(TypedDict, total=False):
    """For a SQL-based Kinesis Data Analytics application, identifies the
    Amazon S3 bucket and object that contains the reference data.

    A Kinesis Data Analytics application loads reference data only once. If
    the data changes, you call the UpdateApplication operation to trigger
    reloading of data into your application.
    """

    BucketARN: Optional[BucketARN]
    FileKey: Optional[FileKey]


class ReferenceDataSource(TypedDict, total=False):
    """For a SQL-based Kinesis Data Analytics application, describes the
    reference data source by providing the source information (Amazon S3
    bucket name and object key name), the resulting in-application table
    name that is created, and the necessary schema to map the data elements
    in the Amazon S3 object to the in-application table.
    """

    TableName: InAppTableName
    S3ReferenceDataSource: Optional[S3ReferenceDataSource]
    ReferenceSchema: SourceSchema


class AddApplicationReferenceDataSourceRequest(ServiceRequest):
    ApplicationName: ApplicationName
    CurrentApplicationVersionId: ApplicationVersionId
    ReferenceDataSource: ReferenceDataSource


class S3ReferenceDataSourceDescription(TypedDict, total=False):
    """For a SQL-based Kinesis Data Analytics application, provides the bucket
    name and object key name that stores the reference data.
    """

    BucketARN: BucketARN
    FileKey: FileKey
    ReferenceRoleARN: Optional[RoleARN]


class ReferenceDataSourceDescription(TypedDict, total=False):
    """For a SQL-based Kinesis Data Analytics application, describes the
    reference data source configured for an application.
    """

    ReferenceId: Id
    TableName: InAppTableName
    S3ReferenceDataSourceDescription: S3ReferenceDataSourceDescription
    ReferenceSchema: Optional[SourceSchema]


ReferenceDataSourceDescriptions = List[ReferenceDataSourceDescription]


class AddApplicationReferenceDataSourceResponse(TypedDict, total=False):
    ApplicationARN: Optional[ResourceARN]
    ApplicationVersionId: Optional[ApplicationVersionId]
    ReferenceDataSourceDescriptions: Optional[ReferenceDataSourceDescriptions]


SecurityGroupIds = List[SecurityGroupId]
SubnetIds = List[SubnetId]


class VpcConfiguration(TypedDict, total=False):
    """Describes the parameters of a VPC used by the application."""

    SubnetIds: SubnetIds
    SecurityGroupIds: SecurityGroupIds


class AddApplicationVpcConfigurationRequest(ServiceRequest):
    ApplicationName: ApplicationName
    CurrentApplicationVersionId: Optional[ApplicationVersionId]
    VpcConfiguration: VpcConfiguration
    ConditionalToken: Optional[ConditionalToken]


class VpcConfigurationDescription(TypedDict, total=False):
    """Describes the parameters of a VPC used by the application."""

    VpcConfigurationId: Id
    VpcId: VpcId
    SubnetIds: SubnetIds
    SecurityGroupIds: SecurityGroupIds


class AddApplicationVpcConfigurationResponse(TypedDict, total=False):
    ApplicationARN: Optional[ResourceARN]
    ApplicationVersionId: Optional[ApplicationVersionId]
    VpcConfigurationDescription: Optional[VpcConfigurationDescription]


class S3ContentLocation(TypedDict, total=False):
    """For a Kinesis Data Analytics application provides a description of an
    Amazon S3 object, including the Amazon Resource Name (ARN) of the S3
    bucket, the name of the Amazon S3 object that contains the data, and the
    version number of the Amazon S3 object that contains the data.
    """

    BucketARN: BucketARN
    FileKey: FileKey
    ObjectVersion: Optional[ObjectVersion]


ZipFileContent = bytes


class CodeContent(TypedDict, total=False):
    """Specifies either the application code, or the location of the
    application code, for a Flink-based Kinesis Data Analytics application.
    """

    TextContent: Optional[TextContent]
    ZipFileContent: Optional[ZipFileContent]
    S3ContentLocation: Optional[S3ContentLocation]


class ApplicationCodeConfiguration(TypedDict, total=False):
    """Describes code configuration for an application."""

    CodeContent: Optional[CodeContent]
    CodeContentType: CodeContentType


class S3ApplicationCodeLocationDescription(TypedDict, total=False):
    """Describes the location of an application's code stored in an S3 bucket."""

    BucketARN: BucketARN
    FileKey: FileKey
    ObjectVersion: Optional[ObjectVersion]


CodeSize = int


class CodeContentDescription(TypedDict, total=False):
    """Describes details about the code of a Kinesis Data Analytics
    application.
    """

    TextContent: Optional[TextContent]
    CodeMD5: Optional[CodeMD5]
    CodeSize: Optional[CodeSize]
    S3ApplicationCodeLocationDescription: Optional[S3ApplicationCodeLocationDescription]


class ApplicationCodeConfigurationDescription(TypedDict, total=False):
    """Describes code configuration for an application."""

    CodeContentType: CodeContentType
    CodeContentDescription: Optional[CodeContentDescription]


class S3ContentLocationUpdate(TypedDict, total=False):
    """Describes an update for the Amazon S3 code content location for an
    application.
    """

    BucketARNUpdate: Optional[BucketARN]
    FileKeyUpdate: Optional[FileKey]
    ObjectVersionUpdate: Optional[ObjectVersion]


class CodeContentUpdate(TypedDict, total=False):
    """Describes an update to the code of an application. Not supported for
    Apache Zeppelin.
    """

    TextContentUpdate: Optional[TextContent]
    ZipFileContentUpdate: Optional[ZipFileContent]
    S3ContentLocationUpdate: Optional[S3ContentLocationUpdate]


class ApplicationCodeConfigurationUpdate(TypedDict, total=False):
    """Describes code configuration updates for an application. This is
    supported for a Flink-based Kinesis Data Analytics application or a
    SQL-based Kinesis Data Analytics application.
    """

    CodeContentTypeUpdate: Optional[CodeContentType]
    CodeContentUpdate: Optional[CodeContentUpdate]


class MavenReference(TypedDict, total=False):
    """The information required to specify a Maven reference. You can use Maven
    references to specify dependency JAR files.
    """

    GroupId: MavenGroupId
    ArtifactId: MavenArtifactId
    Version: MavenVersion


class CustomArtifactConfiguration(TypedDict, total=False):
    """Specifies dependency JARs, as well as JAR files that contain
    user-defined functions (UDF).
    """

    ArtifactType: ArtifactType
    S3ContentLocation: Optional[S3ContentLocation]
    MavenReference: Optional[MavenReference]


CustomArtifactsConfigurationList = List[CustomArtifactConfiguration]


class S3ContentBaseLocation(TypedDict, total=False):
    """The S3 bucket that holds the application information."""

    BucketARN: BucketARN
    BasePath: Optional[BasePath]


class DeployAsApplicationConfiguration(TypedDict, total=False):
    """The information required to deploy a Kinesis Data Analytics Studio
    notebook as an application with durable state.
    """

    S3ContentLocation: S3ContentBaseLocation


class GlueDataCatalogConfiguration(TypedDict, total=False):
    """The configuration of the Glue Data Catalog that you use for Apache Flink
    SQL queries and table API transforms that you write in an application.
    """

    DatabaseARN: DatabaseARN


class CatalogConfiguration(TypedDict, total=False):
    """The configuration parameters for the default Amazon Glue database. You
    use this database for SQL queries that you write in a Kinesis Data
    Analytics Studio notebook.
    """

    GlueDataCatalogConfiguration: GlueDataCatalogConfiguration


class ZeppelinMonitoringConfiguration(TypedDict, total=False):
    """Describes configuration parameters for Amazon CloudWatch logging for a
    Kinesis Data Analytics Studio notebook. For more information about
    CloudWatch logging, see
    `Monitoring <https://docs.aws.amazon.com/kinesisanalytics/latest/java/monitoring-overview.html>`__.
    """

    LogLevel: LogLevel


class ZeppelinApplicationConfiguration(TypedDict, total=False):
    """The configuration of a Kinesis Data Analytics Studio notebook."""

    MonitoringConfiguration: Optional[ZeppelinMonitoringConfiguration]
    CatalogConfiguration: Optional[CatalogConfiguration]
    DeployAsApplicationConfiguration: Optional[DeployAsApplicationConfiguration]
    CustomArtifactsConfiguration: Optional[CustomArtifactsConfigurationList]


VpcConfigurations = List[VpcConfiguration]


class ApplicationSnapshotConfiguration(TypedDict, total=False):
    """Describes whether snapshots are enabled for a Flink-based Kinesis Data
    Analytics application.
    """

    SnapshotsEnabled: BooleanObject


PropertyMap = Dict[PropertyKey, PropertyValue]


class PropertyGroup(TypedDict, total=False):
    """Property key-value pairs passed into an application."""

    PropertyGroupId: Id
    PropertyMap: PropertyMap


PropertyGroups = List[PropertyGroup]


class EnvironmentProperties(TypedDict, total=False):
    """Describes execution properties for a Flink-based Kinesis Data Analytics
    application.
    """

    PropertyGroups: PropertyGroups


class ParallelismConfiguration(TypedDict, total=False):
    """Describes parameters for how a Flink-based Kinesis Data Analytics
    application executes multiple tasks simultaneously. For more information
    about parallelism, see `Parallel
    Execution <https://ci.apache.org/projects/flink/flink-docs-release-1.8/dev/parallel.html>`__
    in the `Apache Flink
    Documentation <https://ci.apache.org/projects/flink/flink-docs-release-1.8/>`__.
    """

    ConfigurationType: ConfigurationType
    Parallelism: Optional[Parallelism]
    ParallelismPerKPU: Optional[ParallelismPerKPU]
    AutoScalingEnabled: Optional[BooleanObject]


class MonitoringConfiguration(TypedDict, total=False):
    """Describes configuration parameters for Amazon CloudWatch logging for an
    application. For more information about CloudWatch logging, see
    `Monitoring <https://docs.aws.amazon.com/kinesisanalytics/latest/java/monitoring-overview.html>`__.
    """

    ConfigurationType: ConfigurationType
    MetricsLevel: Optional[MetricsLevel]
    LogLevel: Optional[LogLevel]


MinPauseBetweenCheckpoints = int
CheckpointInterval = int


class CheckpointConfiguration(TypedDict, total=False):
    """Describes an application's checkpointing configuration. Checkpointing is
    the process of persisting application state for fault tolerance. For
    more information, see `Checkpoints for Fault
    Tolerance <https://ci.apache.org/projects/flink/flink-docs-release-1.8/concepts/programming-model.html#checkpoints-for-fault-tolerance>`__
    in the `Apache Flink
    Documentation <https://ci.apache.org/projects/flink/flink-docs-release-1.8/>`__.
    """

    ConfigurationType: ConfigurationType
    CheckpointingEnabled: Optional[BooleanObject]
    CheckpointInterval: Optional[CheckpointInterval]
    MinPauseBetweenCheckpoints: Optional[MinPauseBetweenCheckpoints]


class FlinkApplicationConfiguration(TypedDict, total=False):
    """Describes configuration parameters for a Flink-based Kinesis Data
    Analytics application or a Studio notebook.
    """

    CheckpointConfiguration: Optional[CheckpointConfiguration]
    MonitoringConfiguration: Optional[MonitoringConfiguration]
    ParallelismConfiguration: Optional[ParallelismConfiguration]


ReferenceDataSources = List[ReferenceDataSource]
Outputs = List[Output]
Inputs = List[Input]


class SqlApplicationConfiguration(TypedDict, total=False):
    """Describes the inputs, outputs, and reference data sources for a
    SQL-based Kinesis Data Analytics application.
    """

    Inputs: Optional[Inputs]
    Outputs: Optional[Outputs]
    ReferenceDataSources: Optional[ReferenceDataSources]


class ApplicationConfiguration(TypedDict, total=False):
    """Specifies the creation parameters for a Kinesis Data Analytics
    application.
    """

    SqlApplicationConfiguration: Optional[SqlApplicationConfiguration]
    FlinkApplicationConfiguration: Optional[FlinkApplicationConfiguration]
    EnvironmentProperties: Optional[EnvironmentProperties]
    ApplicationCodeConfiguration: Optional[ApplicationCodeConfiguration]
    ApplicationSnapshotConfiguration: Optional[ApplicationSnapshotConfiguration]
    VpcConfigurations: Optional[VpcConfigurations]
    ZeppelinApplicationConfiguration: Optional[ZeppelinApplicationConfiguration]


class CustomArtifactConfigurationDescription(TypedDict, total=False):
    """Specifies a dependency JAR or a JAR of user-defined functions."""

    ArtifactType: Optional[ArtifactType]
    S3ContentLocationDescription: Optional[S3ContentLocation]
    MavenReferenceDescription: Optional[MavenReference]


CustomArtifactsConfigurationDescriptionList = List[CustomArtifactConfigurationDescription]


class S3ContentBaseLocationDescription(TypedDict, total=False):
    """The description of the S3 base location that holds the application."""

    BucketARN: BucketARN
    BasePath: Optional[BasePath]


class DeployAsApplicationConfigurationDescription(TypedDict, total=False):
    """The configuration information required to deploy an Amazon Data
    Analytics Studio notebook as an application with durable state.
    """

    S3ContentLocationDescription: S3ContentBaseLocationDescription


class GlueDataCatalogConfigurationDescription(TypedDict, total=False):
    """The configuration of the Glue Data Catalog that you use for Apache Flink
    SQL queries and table API transforms that you write in an application.
    """

    DatabaseARN: DatabaseARN


class CatalogConfigurationDescription(TypedDict, total=False):
    """The configuration parameters for the default Amazon Glue database. You
    use this database for Apache Flink SQL queries and table API transforms
    that you write in a Kinesis Data Analytics Studio notebook.
    """

    GlueDataCatalogConfigurationDescription: GlueDataCatalogConfigurationDescription


class ZeppelinMonitoringConfigurationDescription(TypedDict, total=False):
    """The monitoring configuration for Apache Zeppelin within a Kinesis Data
    Analytics Studio notebook.
    """

    LogLevel: Optional[LogLevel]


class ZeppelinApplicationConfigurationDescription(TypedDict, total=False):
    """The configuration of a Kinesis Data Analytics Studio notebook."""

    MonitoringConfigurationDescription: ZeppelinMonitoringConfigurationDescription
    CatalogConfigurationDescription: Optional[CatalogConfigurationDescription]
    DeployAsApplicationConfigurationDescription: Optional[
        DeployAsApplicationConfigurationDescription
    ]
    CustomArtifactsConfigurationDescription: Optional[CustomArtifactsConfigurationDescriptionList]


VpcConfigurationDescriptions = List[VpcConfigurationDescription]


class ApplicationSnapshotConfigurationDescription(TypedDict, total=False):
    """Describes whether snapshots are enabled for a Flink-based Kinesis Data
    Analytics application.
    """

    SnapshotsEnabled: BooleanObject


class EnvironmentPropertyDescriptions(TypedDict, total=False):
    """Describes the execution properties for an Apache Flink runtime."""

    PropertyGroupDescriptions: Optional[PropertyGroups]


class ParallelismConfigurationDescription(TypedDict, total=False):
    """Describes parameters for how a Flink-based Kinesis Data Analytics
    application executes multiple tasks simultaneously.
    """

    ConfigurationType: Optional[ConfigurationType]
    Parallelism: Optional[Parallelism]
    ParallelismPerKPU: Optional[ParallelismPerKPU]
    CurrentParallelism: Optional[Parallelism]
    AutoScalingEnabled: Optional[BooleanObject]


class MonitoringConfigurationDescription(TypedDict, total=False):
    """Describes configuration parameters for CloudWatch logging for an
    application.
    """

    ConfigurationType: Optional[ConfigurationType]
    MetricsLevel: Optional[MetricsLevel]
    LogLevel: Optional[LogLevel]


class CheckpointConfigurationDescription(TypedDict, total=False):
    """Describes checkpointing parameters for a Flink-based Kinesis Data
    Analytics application.
    """

    ConfigurationType: Optional[ConfigurationType]
    CheckpointingEnabled: Optional[BooleanObject]
    CheckpointInterval: Optional[CheckpointInterval]
    MinPauseBetweenCheckpoints: Optional[MinPauseBetweenCheckpoints]


class FlinkApplicationConfigurationDescription(TypedDict, total=False):
    """Describes configuration parameters for a Flink-based Kinesis Data
    Analytics application.
    """

    CheckpointConfigurationDescription: Optional[CheckpointConfigurationDescription]
    MonitoringConfigurationDescription: Optional[MonitoringConfigurationDescription]
    ParallelismConfigurationDescription: Optional[ParallelismConfigurationDescription]
    JobPlanDescription: Optional[JobPlanDescription]


class FlinkRunConfiguration(TypedDict, total=False):
    """Describes the starting parameters for a Flink-based Kinesis Data
    Analytics application.
    """

    AllowNonRestoredState: Optional[BooleanObject]


class ApplicationRestoreConfiguration(TypedDict, total=False):
    """Specifies the method and snapshot to use when restarting an application
    using previously saved application state.
    """

    ApplicationRestoreType: ApplicationRestoreType
    SnapshotName: Optional[SnapshotName]


class RunConfigurationDescription(TypedDict, total=False):
    """Describes the starting properties for a Kinesis Data Analytics
    application.
    """

    ApplicationRestoreConfigurationDescription: Optional[ApplicationRestoreConfiguration]
    FlinkRunConfigurationDescription: Optional[FlinkRunConfiguration]


class SqlApplicationConfigurationDescription(TypedDict, total=False):
    """Describes the inputs, outputs, and reference data sources for a
    SQL-based Kinesis Data Analytics application.
    """

    InputDescriptions: Optional[InputDescriptions]
    OutputDescriptions: Optional[OutputDescriptions]
    ReferenceDataSourceDescriptions: Optional[ReferenceDataSourceDescriptions]


class ApplicationConfigurationDescription(TypedDict, total=False):
    """Describes details about the application code and starting parameters for
    a Kinesis Data Analytics application.
    """

    SqlApplicationConfigurationDescription: Optional[SqlApplicationConfigurationDescription]
    ApplicationCodeConfigurationDescription: Optional[ApplicationCodeConfigurationDescription]
    RunConfigurationDescription: Optional[RunConfigurationDescription]
    FlinkApplicationConfigurationDescription: Optional[FlinkApplicationConfigurationDescription]
    EnvironmentPropertyDescriptions: Optional[EnvironmentPropertyDescriptions]
    ApplicationSnapshotConfigurationDescription: Optional[
        ApplicationSnapshotConfigurationDescription
    ]
    VpcConfigurationDescriptions: Optional[VpcConfigurationDescriptions]
    ZeppelinApplicationConfigurationDescription: Optional[
        ZeppelinApplicationConfigurationDescription
    ]


class S3ContentBaseLocationUpdate(TypedDict, total=False):
    """The information required to update the S3 base location that holds the
    application.
    """

    BucketARNUpdate: Optional[BucketARN]
    BasePathUpdate: Optional[BasePath]


class DeployAsApplicationConfigurationUpdate(TypedDict, total=False):
    """Updates to the configuration information required to deploy an Amazon
    Data Analytics Studio notebook as an application with durable state.
    """

    S3ContentLocationUpdate: Optional[S3ContentBaseLocationUpdate]


class GlueDataCatalogConfigurationUpdate(TypedDict, total=False):
    """Updates to the configuration of the Glue Data Catalog that you use for
    SQL queries that you write in a Kinesis Data Analytics Studio notebook.
    """

    DatabaseARNUpdate: DatabaseARN


class CatalogConfigurationUpdate(TypedDict, total=False):
    """Updates to the configuration parameters for the default Amazon Glue
    database. You use this database for SQL queries that you write in a
    Kinesis Data Analytics Studio notebook.
    """

    GlueDataCatalogConfigurationUpdate: GlueDataCatalogConfigurationUpdate


class ZeppelinMonitoringConfigurationUpdate(TypedDict, total=False):
    """Updates to the monitoring configuration for Apache Zeppelin within a
    Kinesis Data Analytics Studio notebook.
    """

    LogLevelUpdate: LogLevel


class ZeppelinApplicationConfigurationUpdate(TypedDict, total=False):
    """Updates to the configuration of Kinesis Data Analytics Studio notebook."""

    MonitoringConfigurationUpdate: Optional[ZeppelinMonitoringConfigurationUpdate]
    CatalogConfigurationUpdate: Optional[CatalogConfigurationUpdate]
    DeployAsApplicationConfigurationUpdate: Optional[DeployAsApplicationConfigurationUpdate]
    CustomArtifactsConfigurationUpdate: Optional[CustomArtifactsConfigurationList]


class VpcConfigurationUpdate(TypedDict, total=False):
    """Describes updates to the VPC configuration used by the application."""

    VpcConfigurationId: Id
    SubnetIdUpdates: Optional[SubnetIds]
    SecurityGroupIdUpdates: Optional[SecurityGroupIds]


VpcConfigurationUpdates = List[VpcConfigurationUpdate]


class ApplicationSnapshotConfigurationUpdate(TypedDict, total=False):
    """Describes updates to whether snapshots are enabled for a Flink-based
    Kinesis Data Analytics application.
    """

    SnapshotsEnabledUpdate: BooleanObject


class EnvironmentPropertyUpdates(TypedDict, total=False):
    """Describes updates to the execution property groups for a Flink-based
    Kinesis Data Analytics application or a Studio notebook.
    """

    PropertyGroups: PropertyGroups


class ParallelismConfigurationUpdate(TypedDict, total=False):
    """Describes updates to parameters for how an application executes multiple
    tasks simultaneously.
    """

    ConfigurationTypeUpdate: Optional[ConfigurationType]
    ParallelismUpdate: Optional[Parallelism]
    ParallelismPerKPUUpdate: Optional[ParallelismPerKPU]
    AutoScalingEnabledUpdate: Optional[BooleanObject]


class MonitoringConfigurationUpdate(TypedDict, total=False):
    """Describes updates to configuration parameters for Amazon CloudWatch
    logging for an application.
    """

    ConfigurationTypeUpdate: Optional[ConfigurationType]
    MetricsLevelUpdate: Optional[MetricsLevel]
    LogLevelUpdate: Optional[LogLevel]


class CheckpointConfigurationUpdate(TypedDict, total=False):
    """Describes updates to the checkpointing parameters for a Flink-based
    Kinesis Data Analytics application.
    """

    ConfigurationTypeUpdate: Optional[ConfigurationType]
    CheckpointingEnabledUpdate: Optional[BooleanObject]
    CheckpointIntervalUpdate: Optional[CheckpointInterval]
    MinPauseBetweenCheckpointsUpdate: Optional[MinPauseBetweenCheckpoints]


class FlinkApplicationConfigurationUpdate(TypedDict, total=False):
    """Describes updates to the configuration parameters for a Flink-based
    Kinesis Data Analytics application.
    """

    CheckpointConfigurationUpdate: Optional[CheckpointConfigurationUpdate]
    MonitoringConfigurationUpdate: Optional[MonitoringConfigurationUpdate]
    ParallelismConfigurationUpdate: Optional[ParallelismConfigurationUpdate]


class S3ReferenceDataSourceUpdate(TypedDict, total=False):
    """For a SQL-based Kinesis Data Analytics application, describes the Amazon
    S3 bucket name and object key name for an in-application reference
    table.
    """

    BucketARNUpdate: Optional[BucketARN]
    FileKeyUpdate: Optional[FileKey]


class ReferenceDataSourceUpdate(TypedDict, total=False):
    """When you update a reference data source configuration for a SQL-based
    Kinesis Data Analytics application, this object provides all the updated
    values (such as the source bucket name and object key name), the
    in-application table name that is created, and updated mapping
    information that maps the data in the Amazon S3 object to the
    in-application reference table that is created.
    """

    ReferenceId: Id
    TableNameUpdate: Optional[InAppTableName]
    S3ReferenceDataSourceUpdate: Optional[S3ReferenceDataSourceUpdate]
    ReferenceSchemaUpdate: Optional[SourceSchema]


ReferenceDataSourceUpdates = List[ReferenceDataSourceUpdate]


class LambdaOutputUpdate(TypedDict, total=False):
    """When you update an SQL-based Kinesis Data Analytics application's output
    configuration using the UpdateApplication operation, provides
    information about an Amazon Lambda function that is configured as the
    destination.
    """

    ResourceARNUpdate: ResourceARN


class KinesisFirehoseOutputUpdate(TypedDict, total=False):
    """For a SQL-based Kinesis Data Analytics application, when updating an
    output configuration using the UpdateApplication operation, provides
    information about a Kinesis Data Firehose delivery stream that is
    configured as the destination.
    """

    ResourceARNUpdate: ResourceARN


class KinesisStreamsOutputUpdate(TypedDict, total=False):
    """When you update a SQL-based Kinesis Data Analytics application's output
    configuration using the UpdateApplication operation, provides
    information about a Kinesis data stream that is configured as the
    destination.
    """

    ResourceARNUpdate: ResourceARN


class OutputUpdate(TypedDict, total=False):
    """For a SQL-based Kinesis Data Analytics application, describes updates to
    the output configuration identified by the ``OutputId``.
    """

    OutputId: Id
    NameUpdate: Optional[InAppStreamName]
    KinesisStreamsOutputUpdate: Optional[KinesisStreamsOutputUpdate]
    KinesisFirehoseOutputUpdate: Optional[KinesisFirehoseOutputUpdate]
    LambdaOutputUpdate: Optional[LambdaOutputUpdate]
    DestinationSchemaUpdate: Optional[DestinationSchema]


OutputUpdates = List[OutputUpdate]


class InputParallelismUpdate(TypedDict, total=False):
    """For a SQL-based Kinesis Data Analytics application, provides updates to
    the parallelism count.
    """

    CountUpdate: InputParallelismCount


class InputSchemaUpdate(TypedDict, total=False):
    """Describes updates for an SQL-based Kinesis Data Analytics application's
    input schema.
    """

    RecordFormatUpdate: Optional[RecordFormat]
    RecordEncodingUpdate: Optional[RecordEncoding]
    RecordColumnUpdates: Optional[RecordColumns]


class KinesisFirehoseInputUpdate(TypedDict, total=False):
    """For a SQL-based Kinesis Data Analytics application, when updating
    application input configuration, provides information about a Kinesis
    Data Firehose delivery stream as the streaming source.
    """

    ResourceARNUpdate: ResourceARN


class KinesisStreamsInputUpdate(TypedDict, total=False):
    """When you update the input configuration for a SQL-based Kinesis Data
    Analytics application, provides information about a Kinesis stream as
    the streaming source.
    """

    ResourceARNUpdate: ResourceARN


class InputLambdaProcessorUpdate(TypedDict, total=False):
    """For a SQL-based Kinesis Data Analytics application, represents an update
    to the InputLambdaProcessor that is used to preprocess the records in
    the stream.
    """

    ResourceARNUpdate: ResourceARN


class InputProcessingConfigurationUpdate(TypedDict, total=False):
    """For a SQL-based Kinesis Data Analytics application, describes updates to
    an InputProcessingConfiguration.
    """

    InputLambdaProcessorUpdate: InputLambdaProcessorUpdate


class InputUpdate(TypedDict, total=False):
    """For a SQL-based Kinesis Data Analytics application, describes updates to
    a specific input configuration (identified by the ``InputId`` of an
    application).
    """

    InputId: Id
    NamePrefixUpdate: Optional[InAppStreamName]
    InputProcessingConfigurationUpdate: Optional[InputProcessingConfigurationUpdate]
    KinesisStreamsInputUpdate: Optional[KinesisStreamsInputUpdate]
    KinesisFirehoseInputUpdate: Optional[KinesisFirehoseInputUpdate]
    InputSchemaUpdate: Optional[InputSchemaUpdate]
    InputParallelismUpdate: Optional[InputParallelismUpdate]


InputUpdates = List[InputUpdate]


class SqlApplicationConfigurationUpdate(TypedDict, total=False):
    """Describes updates to the input streams, destination streams, and
    reference data sources for a SQL-based Kinesis Data Analytics
    application.
    """

    InputUpdates: Optional[InputUpdates]
    OutputUpdates: Optional[OutputUpdates]
    ReferenceDataSourceUpdates: Optional[ReferenceDataSourceUpdates]


class ApplicationConfigurationUpdate(TypedDict, total=False):
    """Describes updates to an application's configuration."""

    SqlApplicationConfigurationUpdate: Optional[SqlApplicationConfigurationUpdate]
    ApplicationCodeConfigurationUpdate: Optional[ApplicationCodeConfigurationUpdate]
    FlinkApplicationConfigurationUpdate: Optional[FlinkApplicationConfigurationUpdate]
    EnvironmentPropertyUpdates: Optional[EnvironmentPropertyUpdates]
    ApplicationSnapshotConfigurationUpdate: Optional[ApplicationSnapshotConfigurationUpdate]
    VpcConfigurationUpdates: Optional[VpcConfigurationUpdates]
    ZeppelinApplicationConfigurationUpdate: Optional[ZeppelinApplicationConfigurationUpdate]


class ApplicationMaintenanceConfigurationDescription(TypedDict, total=False):
    """The details of the maintenance configuration for the application."""

    ApplicationMaintenanceWindowStartTime: ApplicationMaintenanceWindowStartTime
    ApplicationMaintenanceWindowEndTime: ApplicationMaintenanceWindowEndTime


Timestamp = datetime


class ApplicationDetail(TypedDict, total=False):
    """Describes the application, including the application Amazon Resource
    Name (ARN), status, latest version, and input and output configurations.
    """

    ApplicationARN: ResourceARN
    ApplicationDescription: Optional[ApplicationDescription]
    ApplicationName: ApplicationName
    RuntimeEnvironment: RuntimeEnvironment
    ServiceExecutionRole: Optional[RoleARN]
    ApplicationStatus: ApplicationStatus
    ApplicationVersionId: ApplicationVersionId
    CreateTimestamp: Optional[Timestamp]
    LastUpdateTimestamp: Optional[Timestamp]
    ApplicationConfigurationDescription: Optional[ApplicationConfigurationDescription]
    CloudWatchLoggingOptionDescriptions: Optional[CloudWatchLoggingOptionDescriptions]
    ApplicationMaintenanceConfigurationDescription: Optional[
        ApplicationMaintenanceConfigurationDescription
    ]
    ApplicationVersionUpdatedFrom: Optional[ApplicationVersionId]
    ApplicationVersionRolledBackFrom: Optional[ApplicationVersionId]
    ConditionalToken: Optional[ConditionalToken]
    ApplicationVersionRolledBackTo: Optional[ApplicationVersionId]
    ApplicationMode: Optional[ApplicationMode]


class ApplicationMaintenanceConfigurationUpdate(TypedDict, total=False):
    """Describes the updated maintenance configuration for the application."""

    ApplicationMaintenanceWindowStartTimeUpdate: ApplicationMaintenanceWindowStartTime


class ApplicationSummary(TypedDict, total=False):
    """Provides application summary information, including the application
    Amazon Resource Name (ARN), name, and status.
    """

    ApplicationName: ApplicationName
    ApplicationARN: ResourceARN
    ApplicationStatus: ApplicationStatus
    ApplicationVersionId: ApplicationVersionId
    RuntimeEnvironment: RuntimeEnvironment
    ApplicationMode: Optional[ApplicationMode]


ApplicationSummaries = List[ApplicationSummary]


class ApplicationVersionSummary(TypedDict, total=False):
    """The summary of the application version."""

    ApplicationVersionId: ApplicationVersionId
    ApplicationStatus: ApplicationStatus


ApplicationVersionSummaries = List[ApplicationVersionSummary]


class CloudWatchLoggingOptionUpdate(TypedDict, total=False):
    """Describes the Amazon CloudWatch logging option updates."""

    CloudWatchLoggingOptionId: Id
    LogStreamARNUpdate: Optional[LogStreamARN]


CloudWatchLoggingOptionUpdates = List[CloudWatchLoggingOptionUpdate]
CloudWatchLoggingOptions = List[CloudWatchLoggingOption]
SessionExpirationDurationInSeconds = int


class CreateApplicationPresignedUrlRequest(ServiceRequest):
    ApplicationName: ApplicationName
    UrlType: UrlType
    SessionExpirationDurationInSeconds: Optional[SessionExpirationDurationInSeconds]


class CreateApplicationPresignedUrlResponse(TypedDict, total=False):
    AuthorizedUrl: Optional[AuthorizedUrl]


class Tag(TypedDict, total=False):
    """A key-value pair (the value is optional) that you can define and assign
    to Amazon resources. If you specify a tag that already exists, the tag
    value is replaced with the value that you specify in the request. Note
    that the maximum number of application tags includes system tags. The
    maximum number of user-defined application tags is 50. For more
    information, see `Using
    Tagging <https://docs.aws.amazon.com/kinesisanalytics/latest/java/how-tagging.html>`__.
    """

    Key: TagKey
    Value: Optional[TagValue]


Tags = List[Tag]


class CreateApplicationRequest(ServiceRequest):
    ApplicationName: ApplicationName
    ApplicationDescription: Optional[ApplicationDescription]
    RuntimeEnvironment: RuntimeEnvironment
    ServiceExecutionRole: RoleARN
    ApplicationConfiguration: Optional[ApplicationConfiguration]
    CloudWatchLoggingOptions: Optional[CloudWatchLoggingOptions]
    Tags: Optional[Tags]
    ApplicationMode: Optional[ApplicationMode]


class CreateApplicationResponse(TypedDict, total=False):
    ApplicationDetail: ApplicationDetail


class CreateApplicationSnapshotRequest(ServiceRequest):
    ApplicationName: ApplicationName
    SnapshotName: SnapshotName


class CreateApplicationSnapshotResponse(TypedDict, total=False):
    pass


class DeleteApplicationCloudWatchLoggingOptionRequest(ServiceRequest):
    ApplicationName: ApplicationName
    CurrentApplicationVersionId: Optional[ApplicationVersionId]
    CloudWatchLoggingOptionId: Id
    ConditionalToken: Optional[ConditionalToken]


class DeleteApplicationCloudWatchLoggingOptionResponse(TypedDict, total=False):
    ApplicationARN: Optional[ResourceARN]
    ApplicationVersionId: Optional[ApplicationVersionId]
    CloudWatchLoggingOptionDescriptions: Optional[CloudWatchLoggingOptionDescriptions]


class DeleteApplicationInputProcessingConfigurationRequest(ServiceRequest):
    ApplicationName: ApplicationName
    CurrentApplicationVersionId: ApplicationVersionId
    InputId: Id


class DeleteApplicationInputProcessingConfigurationResponse(TypedDict, total=False):
    ApplicationARN: Optional[ResourceARN]
    ApplicationVersionId: Optional[ApplicationVersionId]


class DeleteApplicationOutputRequest(ServiceRequest):
    ApplicationName: ApplicationName
    CurrentApplicationVersionId: ApplicationVersionId
    OutputId: Id


class DeleteApplicationOutputResponse(TypedDict, total=False):
    ApplicationARN: Optional[ResourceARN]
    ApplicationVersionId: Optional[ApplicationVersionId]


class DeleteApplicationReferenceDataSourceRequest(ServiceRequest):
    ApplicationName: ApplicationName
    CurrentApplicationVersionId: ApplicationVersionId
    ReferenceId: Id


class DeleteApplicationReferenceDataSourceResponse(TypedDict, total=False):
    ApplicationARN: Optional[ResourceARN]
    ApplicationVersionId: Optional[ApplicationVersionId]


class DeleteApplicationRequest(ServiceRequest):
    ApplicationName: ApplicationName
    CreateTimestamp: Timestamp


class DeleteApplicationResponse(TypedDict, total=False):
    pass


class DeleteApplicationSnapshotRequest(ServiceRequest):
    ApplicationName: ApplicationName
    SnapshotName: SnapshotName
    SnapshotCreationTimestamp: Timestamp


class DeleteApplicationSnapshotResponse(TypedDict, total=False):
    pass


class DeleteApplicationVpcConfigurationRequest(ServiceRequest):
    ApplicationName: ApplicationName
    CurrentApplicationVersionId: Optional[ApplicationVersionId]
    VpcConfigurationId: Id
    ConditionalToken: Optional[ConditionalToken]


class DeleteApplicationVpcConfigurationResponse(TypedDict, total=False):
    ApplicationARN: Optional[ResourceARN]
    ApplicationVersionId: Optional[ApplicationVersionId]


class DescribeApplicationRequest(ServiceRequest):
    ApplicationName: ApplicationName
    IncludeAdditionalDetails: Optional[BooleanObject]


class DescribeApplicationResponse(TypedDict, total=False):
    ApplicationDetail: ApplicationDetail


class DescribeApplicationSnapshotRequest(ServiceRequest):
    ApplicationName: ApplicationName
    SnapshotName: SnapshotName


class SnapshotDetails(TypedDict, total=False):
    """Provides details about a snapshot of application state."""

    SnapshotName: SnapshotName
    SnapshotStatus: SnapshotStatus
    ApplicationVersionId: ApplicationVersionId
    SnapshotCreationTimestamp: Optional[Timestamp]


class DescribeApplicationSnapshotResponse(TypedDict, total=False):
    SnapshotDetails: SnapshotDetails


class DescribeApplicationVersionRequest(ServiceRequest):
    ApplicationName: ApplicationName
    ApplicationVersionId: ApplicationVersionId


class DescribeApplicationVersionResponse(TypedDict, total=False):
    ApplicationVersionDetail: Optional[ApplicationDetail]


class S3Configuration(TypedDict, total=False):
    """For a SQL-based Kinesis Data Analytics application, provides a
    description of an Amazon S3 data source, including the Amazon Resource
    Name (ARN) of the S3 bucket and the name of the Amazon S3 object that
    contains the data.
    """

    BucketARN: BucketARN
    FileKey: FileKey


class DiscoverInputSchemaRequest(ServiceRequest):
    ResourceARN: Optional[ResourceARN]
    ServiceExecutionRole: RoleARN
    InputStartingPositionConfiguration: Optional[InputStartingPositionConfiguration]
    S3Configuration: Optional[S3Configuration]
    InputProcessingConfiguration: Optional[InputProcessingConfiguration]


ParsedInputRecord = List[ParsedInputRecordField]
ParsedInputRecords = List[ParsedInputRecord]


class DiscoverInputSchemaResponse(TypedDict, total=False):
    InputSchema: Optional[SourceSchema]
    ParsedInputRecords: Optional[ParsedInputRecords]
    ProcessedInputRecords: Optional[ProcessedInputRecords]
    RawInputRecords: Optional[RawInputRecords]


class ListApplicationSnapshotsRequest(ServiceRequest):
    ApplicationName: ApplicationName
    Limit: Optional[ListSnapshotsInputLimit]
    NextToken: Optional[NextToken]


SnapshotSummaries = List[SnapshotDetails]


class ListApplicationSnapshotsResponse(TypedDict, total=False):
    SnapshotSummaries: Optional[SnapshotSummaries]
    NextToken: Optional[NextToken]


class ListApplicationVersionsRequest(ServiceRequest):
    ApplicationName: ApplicationName
    Limit: Optional[ListApplicationVersionsInputLimit]
    NextToken: Optional[NextToken]


class ListApplicationVersionsResponse(TypedDict, total=False):
    ApplicationVersionSummaries: Optional[ApplicationVersionSummaries]
    NextToken: Optional[NextToken]


class ListApplicationsRequest(ServiceRequest):
    Limit: Optional[ListApplicationsInputLimit]
    NextToken: Optional[ApplicationName]


class ListApplicationsResponse(TypedDict, total=False):
    ApplicationSummaries: ApplicationSummaries
    NextToken: Optional[ApplicationName]


class ListTagsForResourceRequest(ServiceRequest):
    ResourceARN: KinesisAnalyticsARN


class ListTagsForResourceResponse(TypedDict, total=False):
    Tags: Optional[Tags]


class RollbackApplicationRequest(ServiceRequest):
    ApplicationName: ApplicationName
    CurrentApplicationVersionId: ApplicationVersionId


class RollbackApplicationResponse(TypedDict, total=False):
    ApplicationDetail: ApplicationDetail


class SqlRunConfiguration(TypedDict, total=False):
    """Describes the starting parameters for a SQL-based Kinesis Data Analytics
    application.
    """

    InputId: Id
    InputStartingPositionConfiguration: InputStartingPositionConfiguration


SqlRunConfigurations = List[SqlRunConfiguration]


class RunConfiguration(TypedDict, total=False):
    """Describes the starting parameters for an Kinesis Data Analytics
    application.
    """

    FlinkRunConfiguration: Optional[FlinkRunConfiguration]
    SqlRunConfigurations: Optional[SqlRunConfigurations]
    ApplicationRestoreConfiguration: Optional[ApplicationRestoreConfiguration]


class RunConfigurationUpdate(TypedDict, total=False):
    """Describes the updates to the starting parameters for a Kinesis Data
    Analytics application.
    """

    FlinkRunConfiguration: Optional[FlinkRunConfiguration]
    ApplicationRestoreConfiguration: Optional[ApplicationRestoreConfiguration]


class StartApplicationRequest(ServiceRequest):
    ApplicationName: ApplicationName
    RunConfiguration: Optional[RunConfiguration]


class StartApplicationResponse(TypedDict, total=False):
    pass


class StopApplicationRequest(ServiceRequest):
    ApplicationName: ApplicationName
    Force: Optional[BooleanObject]


class StopApplicationResponse(TypedDict, total=False):
    pass


TagKeys = List[TagKey]


class TagResourceRequest(ServiceRequest):
    ResourceARN: KinesisAnalyticsARN
    Tags: Tags


class TagResourceResponse(TypedDict, total=False):
    pass


class UntagResourceRequest(ServiceRequest):
    ResourceARN: KinesisAnalyticsARN
    TagKeys: TagKeys


class UntagResourceResponse(TypedDict, total=False):
    pass


class UpdateApplicationMaintenanceConfigurationRequest(ServiceRequest):
    ApplicationName: ApplicationName
    ApplicationMaintenanceConfigurationUpdate: ApplicationMaintenanceConfigurationUpdate


class UpdateApplicationMaintenanceConfigurationResponse(TypedDict, total=False):
    ApplicationARN: Optional[ResourceARN]
    ApplicationMaintenanceConfigurationDescription: Optional[
        ApplicationMaintenanceConfigurationDescription
    ]


class UpdateApplicationRequest(ServiceRequest):
    ApplicationName: ApplicationName
    CurrentApplicationVersionId: Optional[ApplicationVersionId]
    ApplicationConfigurationUpdate: Optional[ApplicationConfigurationUpdate]
    ServiceExecutionRoleUpdate: Optional[RoleARN]
    RunConfigurationUpdate: Optional[RunConfigurationUpdate]
    CloudWatchLoggingOptionUpdates: Optional[CloudWatchLoggingOptionUpdates]
    ConditionalToken: Optional[ConditionalToken]


class UpdateApplicationResponse(TypedDict, total=False):
    ApplicationDetail: ApplicationDetail


class Kinesisanalyticsv2Api:
    service = "kinesisanalyticsv2"
    version = "2018-05-23"

    @handler("AddApplicationCloudWatchLoggingOption")
    def add_application_cloud_watch_logging_option(
        self,
        context: RequestContext,
        application_name: ApplicationName,
        cloud_watch_logging_option: CloudWatchLoggingOption,
        current_application_version_id: ApplicationVersionId = None,
        conditional_token: ConditionalToken = None,
    ) -> AddApplicationCloudWatchLoggingOptionResponse:
        """Adds an Amazon CloudWatch log stream to monitor application
        configuration errors.

        :param application_name: The Kinesis Data Analytics application name.
        :param cloud_watch_logging_option: Provides the Amazon CloudWatch log stream Amazon Resource Name (ARN).
        :param current_application_version_id: The version ID of the Kinesis Data Analytics application.
        :param conditional_token: A value you use to implement strong concurrency for application updates.
        :returns: AddApplicationCloudWatchLoggingOptionResponse
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises InvalidArgumentException:
        :raises ConcurrentModificationException:
        :raises InvalidRequestException:
        :raises InvalidApplicationConfigurationException:
        """
        raise NotImplementedError

    @handler("AddApplicationInput")
    def add_application_input(
        self,
        context: RequestContext,
        application_name: ApplicationName,
        current_application_version_id: ApplicationVersionId,
        input: Input,
    ) -> AddApplicationInputResponse:
        """Adds a streaming source to your SQL-based Kinesis Data Analytics
        application.

        You can add a streaming source when you create an application, or you
        can use this operation to add a streaming source after you create an
        application. For more information, see CreateApplication.

        Any configuration update, including adding a streaming source using this
        operation, results in a new version of the application. You can use the
        DescribeApplication operation to find the current application version.

        :param application_name: The name of your existing application to which you want to add the
        streaming source.
        :param current_application_version_id: The current version of your application.
        :param input: The Input to add.
        :returns: AddApplicationInputResponse
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises InvalidArgumentException:
        :raises ConcurrentModificationException:
        :raises CodeValidationException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("AddApplicationInputProcessingConfiguration")
    def add_application_input_processing_configuration(
        self,
        context: RequestContext,
        application_name: ApplicationName,
        current_application_version_id: ApplicationVersionId,
        input_id: Id,
        input_processing_configuration: InputProcessingConfiguration,
    ) -> AddApplicationInputProcessingConfigurationResponse:
        """Adds an InputProcessingConfiguration to a SQL-based Kinesis Data
        Analytics application. An input processor pre-processes records on the
        input stream before the application's SQL code executes. Currently, the
        only input processor available is `Amazon
        Lambda <https://docs.aws.amazon.com/lambda/>`__.

        :param application_name: The name of the application to which you want to add the input
        processing configuration.
        :param current_application_version_id: The version of the application to which you want to add the input
        processing configuration.
        :param input_id: The ID of the input configuration to add the input processing
        configuration to.
        :param input_processing_configuration: The InputProcessingConfiguration to add to the application.
        :returns: AddApplicationInputProcessingConfigurationResponse
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises InvalidArgumentException:
        :raises ConcurrentModificationException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("AddApplicationOutput")
    def add_application_output(
        self,
        context: RequestContext,
        application_name: ApplicationName,
        current_application_version_id: ApplicationVersionId,
        output: Output,
    ) -> AddApplicationOutputResponse:
        """Adds an external destination to your SQL-based Kinesis Data Analytics
        application.

        If you want Kinesis Data Analytics to deliver data from an
        in-application stream within your application to an external destination
        (such as an Kinesis data stream, a Kinesis Data Firehose delivery
        stream, or an Amazon Lambda function), you add the relevant
        configuration to your application using this operation. You can
        configure one or more outputs for your application. Each output
        configuration maps an in-application stream and an external destination.

        You can use one of the output configurations to deliver data from your
        in-application error stream to an external destination so that you can
        analyze the errors.

        Any configuration update, including adding a streaming source using this
        operation, results in a new version of the application. You can use the
        DescribeApplication operation to find the current application version.

        :param application_name: The name of the application to which you want to add the output
        configuration.
        :param current_application_version_id: The version of the application to which you want to add the output
        configuration.
        :param output: An array of objects, each describing one output configuration.
        :returns: AddApplicationOutputResponse
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises InvalidArgumentException:
        :raises ConcurrentModificationException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("AddApplicationReferenceDataSource")
    def add_application_reference_data_source(
        self,
        context: RequestContext,
        application_name: ApplicationName,
        current_application_version_id: ApplicationVersionId,
        reference_data_source: ReferenceDataSource,
    ) -> AddApplicationReferenceDataSourceResponse:
        """Adds a reference data source to an existing SQL-based Kinesis Data
        Analytics application.

        Kinesis Data Analytics reads reference data (that is, an Amazon S3
        object) and creates an in-application table within your application. In
        the request, you provide the source (S3 bucket name and object key
        name), name of the in-application table to create, and the necessary
        mapping information that describes how data in an Amazon S3 object maps
        to columns in the resulting in-application table.

        :param application_name: The name of an existing application.
        :param current_application_version_id: The version of the application for which you are adding the reference
        data source.
        :param reference_data_source: The reference data source can be an object in your Amazon S3 bucket.
        :returns: AddApplicationReferenceDataSourceResponse
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises InvalidArgumentException:
        :raises ConcurrentModificationException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("AddApplicationVpcConfiguration")
    def add_application_vpc_configuration(
        self,
        context: RequestContext,
        application_name: ApplicationName,
        vpc_configuration: VpcConfiguration,
        current_application_version_id: ApplicationVersionId = None,
        conditional_token: ConditionalToken = None,
    ) -> AddApplicationVpcConfigurationResponse:
        """Adds a Virtual Private Cloud (VPC) configuration to the application.
        Applications can use VPCs to store and access resources securely.

        Note the following about VPC configurations for Kinesis Data Analytics
        applications:

        -  VPC configurations are not supported for SQL applications.

        -  When a VPC is added to a Kinesis Data Analytics application, the
           application can no longer be accessed from the Internet directly. To
           enable Internet access to the application, add an Internet gateway to
           your VPC.

        :param application_name: The name of an existing application.
        :param vpc_configuration: Description of the VPC to add to the application.
        :param current_application_version_id: The version of the application to which you want to add the VPC
        configuration.
        :param conditional_token: A value you use to implement strong concurrency for application updates.
        :returns: AddApplicationVpcConfigurationResponse
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises InvalidArgumentException:
        :raises ConcurrentModificationException:
        :raises InvalidApplicationConfigurationException:
        """
        raise NotImplementedError

    @handler("CreateApplication")
    def create_application(
        self,
        context: RequestContext,
        application_name: ApplicationName,
        runtime_environment: RuntimeEnvironment,
        service_execution_role: RoleARN,
        application_description: ApplicationDescription = None,
        application_configuration: ApplicationConfiguration = None,
        cloud_watch_logging_options: CloudWatchLoggingOptions = None,
        tags: Tags = None,
        application_mode: ApplicationMode = None,
    ) -> CreateApplicationResponse:
        """Creates a Kinesis Data Analytics application. For information about
        creating a Kinesis Data Analytics application, see `Creating an
        Application <https://docs.aws.amazon.com/kinesisanalytics/latest/java/getting-started.html>`__.

        :param application_name: The name of your application (for example, ``sample-app``).
        :param runtime_environment: The runtime environment for the application.
        :param service_execution_role: The IAM role used by the application to access Kinesis data streams,
        Kinesis Data Firehose delivery streams, Amazon S3 objects, and other
        external resources.
        :param application_description: A summary description of the application.
        :param application_configuration: Use this parameter to configure the application.
        :param cloud_watch_logging_options: Use this parameter to configure an Amazon CloudWatch log stream to
        monitor application configuration errors.
        :param tags: A list of one or more tags to assign to the application.
        :param application_mode: Use the ``STREAMING`` mode to create a Kinesis Data Analytics For Flink
        application.
        :returns: CreateApplicationResponse
        :raises CodeValidationException:
        :raises ResourceInUseException:
        :raises LimitExceededException:
        :raises InvalidArgumentException:
        :raises InvalidRequestException:
        :raises TooManyTagsException:
        :raises ConcurrentModificationException:
        :raises UnsupportedOperationException:
        """
        raise NotImplementedError

    @handler("CreateApplicationPresignedUrl")
    def create_application_presigned_url(
        self,
        context: RequestContext,
        application_name: ApplicationName,
        url_type: UrlType,
        session_expiration_duration_in_seconds: SessionExpirationDurationInSeconds = None,
    ) -> CreateApplicationPresignedUrlResponse:
        """Creates and returns a URL that you can use to connect to an
        application's extension.

        The IAM role or user used to call this API defines the permissions to
        access the extension. After the presigned URL is created, no additional
        permission is required to access this URL. IAM authorization policies
        for this API are also enforced for every HTTP request that attempts to
        connect to the extension.

        You control the amount of time that the URL will be valid using the
        ``SessionExpirationDurationInSeconds`` parameter. If you do not provide
        this parameter, the returned URL is valid for twelve hours.

        The URL that you get from a call to CreateApplicationPresignedUrl must
        be used within 3 minutes to be valid. If you first try to use the URL
        after the 3-minute limit expires, the service returns an HTTP 403
        Forbidden error.

        :param application_name: The name of the application.
        :param url_type: The type of the extension for which to create and return a URL.
        :param session_expiration_duration_in_seconds: The duration in seconds for which the returned URL will be valid.
        :returns: CreateApplicationPresignedUrlResponse
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises InvalidArgumentException:
        """
        raise NotImplementedError

    @handler("CreateApplicationSnapshot")
    def create_application_snapshot(
        self,
        context: RequestContext,
        application_name: ApplicationName,
        snapshot_name: SnapshotName,
    ) -> CreateApplicationSnapshotResponse:
        """Creates a snapshot of the application's state data.

        :param application_name: The name of an existing application.
        :param snapshot_name: An identifier for the application snapshot.
        :returns: CreateApplicationSnapshotResponse
        :raises ResourceInUseException:
        :raises ResourceNotFoundException:
        :raises LimitExceededException:
        :raises InvalidArgumentException:
        :raises UnsupportedOperationException:
        :raises InvalidRequestException:
        :raises InvalidApplicationConfigurationException:
        """
        raise NotImplementedError

    @handler("DeleteApplication")
    def delete_application(
        self,
        context: RequestContext,
        application_name: ApplicationName,
        create_timestamp: Timestamp,
    ) -> DeleteApplicationResponse:
        """Deletes the specified application. Kinesis Data Analytics halts
        application execution and deletes the application.

        :param application_name: The name of the application to delete.
        :param create_timestamp: Use the ``DescribeApplication`` operation to get this value.
        :returns: DeleteApplicationResponse
        :raises ConcurrentModificationException:
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises InvalidArgumentException:
        :raises InvalidRequestException:
        :raises InvalidApplicationConfigurationException:
        """
        raise NotImplementedError

    @handler("DeleteApplicationCloudWatchLoggingOption")
    def delete_application_cloud_watch_logging_option(
        self,
        context: RequestContext,
        application_name: ApplicationName,
        cloud_watch_logging_option_id: Id,
        current_application_version_id: ApplicationVersionId = None,
        conditional_token: ConditionalToken = None,
    ) -> DeleteApplicationCloudWatchLoggingOptionResponse:
        """Deletes an Amazon CloudWatch log stream from an Kinesis Data Analytics
        application.

        :param application_name: The application name.
        :param cloud_watch_logging_option_id: The ``CloudWatchLoggingOptionId`` of the Amazon CloudWatch logging
        option to delete.
        :param current_application_version_id: The version ID of the application.
        :param conditional_token: A value you use to implement strong concurrency for application updates.
        :returns: DeleteApplicationCloudWatchLoggingOptionResponse
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises InvalidArgumentException:
        :raises ConcurrentModificationException:
        :raises InvalidRequestException:
        :raises InvalidApplicationConfigurationException:
        """
        raise NotImplementedError

    @handler("DeleteApplicationInputProcessingConfiguration")
    def delete_application_input_processing_configuration(
        self,
        context: RequestContext,
        application_name: ApplicationName,
        current_application_version_id: ApplicationVersionId,
        input_id: Id,
    ) -> DeleteApplicationInputProcessingConfigurationResponse:
        """Deletes an InputProcessingConfiguration from an input.

        :param application_name: The name of the application.
        :param current_application_version_id: The application version.
        :param input_id: The ID of the input configuration from which to delete the input
        processing configuration.
        :returns: DeleteApplicationInputProcessingConfigurationResponse
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises InvalidArgumentException:
        :raises ConcurrentModificationException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("DeleteApplicationOutput")
    def delete_application_output(
        self,
        context: RequestContext,
        application_name: ApplicationName,
        current_application_version_id: ApplicationVersionId,
        output_id: Id,
    ) -> DeleteApplicationOutputResponse:
        """Deletes the output destination configuration from your SQL-based Kinesis
        Data Analytics application's configuration. Kinesis Data Analytics will
        no longer write data from the corresponding in-application stream to the
        external output destination.

        :param application_name: The application name.
        :param current_application_version_id: The application version.
        :param output_id: The ID of the configuration to delete.
        :returns: DeleteApplicationOutputResponse
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises InvalidArgumentException:
        :raises ConcurrentModificationException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("DeleteApplicationReferenceDataSource")
    def delete_application_reference_data_source(
        self,
        context: RequestContext,
        application_name: ApplicationName,
        current_application_version_id: ApplicationVersionId,
        reference_id: Id,
    ) -> DeleteApplicationReferenceDataSourceResponse:
        """Deletes a reference data source configuration from the specified
        SQL-based Kinesis Data Analytics application's configuration.

        If the application is running, Kinesis Data Analytics immediately
        removes the in-application table that you created using the
        AddApplicationReferenceDataSource operation.

        :param application_name: The name of an existing application.
        :param current_application_version_id: The current application version.
        :param reference_id: The ID of the reference data source.
        :returns: DeleteApplicationReferenceDataSourceResponse
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises InvalidArgumentException:
        :raises ConcurrentModificationException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("DeleteApplicationSnapshot")
    def delete_application_snapshot(
        self,
        context: RequestContext,
        application_name: ApplicationName,
        snapshot_name: SnapshotName,
        snapshot_creation_timestamp: Timestamp,
    ) -> DeleteApplicationSnapshotResponse:
        """Deletes a snapshot of application state.

        :param application_name: The name of an existing application.
        :param snapshot_name: The identifier for the snapshot delete.
        :param snapshot_creation_timestamp: The creation timestamp of the application snapshot to delete.
        :returns: DeleteApplicationSnapshotResponse
        :raises ResourceInUseException:
        :raises InvalidArgumentException:
        :raises UnsupportedOperationException:
        :raises InvalidRequestException:
        :raises ResourceNotFoundException:
        :raises ConcurrentModificationException:
        """
        raise NotImplementedError

    @handler("DeleteApplicationVpcConfiguration")
    def delete_application_vpc_configuration(
        self,
        context: RequestContext,
        application_name: ApplicationName,
        vpc_configuration_id: Id,
        current_application_version_id: ApplicationVersionId = None,
        conditional_token: ConditionalToken = None,
    ) -> DeleteApplicationVpcConfigurationResponse:
        """Removes a VPC configuration from a Kinesis Data Analytics application.

        :param application_name: The name of an existing application.
        :param vpc_configuration_id: The ID of the VPC configuration to delete.
        :param current_application_version_id: The current application version ID.
        :param conditional_token: A value you use to implement strong concurrency for application updates.
        :returns: DeleteApplicationVpcConfigurationResponse
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises InvalidArgumentException:
        :raises ConcurrentModificationException:
        :raises InvalidApplicationConfigurationException:
        """
        raise NotImplementedError

    @handler("DescribeApplication")
    def describe_application(
        self,
        context: RequestContext,
        application_name: ApplicationName,
        include_additional_details: BooleanObject = None,
    ) -> DescribeApplicationResponse:
        """Returns information about a specific Kinesis Data Analytics application.

        If you want to retrieve a list of all applications in your account, use
        the ListApplications operation.

        :param application_name: The name of the application.
        :param include_additional_details: Displays verbose information about a Kinesis Data Analytics application,
        including the application's job plan.
        :returns: DescribeApplicationResponse
        :raises ResourceNotFoundException:
        :raises InvalidArgumentException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("DescribeApplicationSnapshot")
    def describe_application_snapshot(
        self,
        context: RequestContext,
        application_name: ApplicationName,
        snapshot_name: SnapshotName,
    ) -> DescribeApplicationSnapshotResponse:
        """Returns information about a snapshot of application state data.

        :param application_name: The name of an existing application.
        :param snapshot_name: The identifier of an application snapshot.
        :returns: DescribeApplicationSnapshotResponse
        :raises ResourceNotFoundException:
        :raises InvalidArgumentException:
        :raises UnsupportedOperationException:
        """
        raise NotImplementedError

    @handler("DescribeApplicationVersion")
    def describe_application_version(
        self,
        context: RequestContext,
        application_name: ApplicationName,
        application_version_id: ApplicationVersionId,
    ) -> DescribeApplicationVersionResponse:
        """Provides a detailed description of a specified version of the
        application. To see a list of all the versions of an application, invoke
        the ListApplicationVersions operation.

        This operation is supported only for Amazon Kinesis Data Analytics for
        Apache Flink.

        :param application_name: The name of the application for which you want to get the version
        description.
        :param application_version_id: The ID of the application version for which you want to get the
        description.
        :returns: DescribeApplicationVersionResponse
        :raises InvalidArgumentException:
        :raises ResourceNotFoundException:
        :raises UnsupportedOperationException:
        """
        raise NotImplementedError

    @handler("DiscoverInputSchema")
    def discover_input_schema(
        self,
        context: RequestContext,
        service_execution_role: RoleARN,
        resource_arn: ResourceARN = None,
        input_starting_position_configuration: InputStartingPositionConfiguration = None,
        s3_configuration: S3Configuration = None,
        input_processing_configuration: InputProcessingConfiguration = None,
    ) -> DiscoverInputSchemaResponse:
        """Infers a schema for a SQL-based Kinesis Data Analytics application by
        evaluating sample records on the specified streaming source (Kinesis
        data stream or Kinesis Data Firehose delivery stream) or Amazon S3
        object. In the response, the operation returns the inferred schema and
        also the sample records that the operation used to infer the schema.

        You can use the inferred schema when configuring a streaming source for
        your application. When you create an application using the Kinesis Data
        Analytics console, the console uses this operation to infer a schema and
        show it in the console user interface.

        :param service_execution_role: The ARN of the role that is used to access the streaming source.
        :param resource_arn: The Amazon Resource Name (ARN) of the streaming source.
        :param input_starting_position_configuration: The point at which you want Kinesis Data Analytics to start reading
        records from the specified streaming source discovery purposes.
        :param s3_configuration: Specify this parameter to discover a schema from data in an Amazon S3
        object.
        :param input_processing_configuration: The InputProcessingConfiguration to use to preprocess the records before
        discovering the schema of the records.
        :returns: DiscoverInputSchemaResponse
        :raises InvalidArgumentException:
        :raises UnableToDetectSchemaException:
        :raises ResourceProvisionedThroughputExceededException:
        :raises ServiceUnavailableException:
        :raises InvalidRequestException:
        :raises UnsupportedOperationException:
        """
        raise NotImplementedError

    @handler("ListApplicationSnapshots")
    def list_application_snapshots(
        self,
        context: RequestContext,
        application_name: ApplicationName,
        limit: ListSnapshotsInputLimit = None,
        next_token: NextToken = None,
    ) -> ListApplicationSnapshotsResponse:
        """Lists information about the current application snapshots.

        :param application_name: The name of an existing application.
        :param limit: The maximum number of application snapshots to list.
        :param next_token: Use this parameter if you receive a ``NextToken`` response in a previous
        request that indicates that there is more output available.
        :returns: ListApplicationSnapshotsResponse
        :raises InvalidArgumentException:
        :raises UnsupportedOperationException:
        """
        raise NotImplementedError

    @handler("ListApplicationVersions")
    def list_application_versions(
        self,
        context: RequestContext,
        application_name: ApplicationName,
        limit: ListApplicationVersionsInputLimit = None,
        next_token: NextToken = None,
    ) -> ListApplicationVersionsResponse:
        """Lists all the versions for the specified application, including versions
        that were rolled back. The response also includes a summary of the
        configuration associated with each version.

        To get the complete description of a specific application version,
        invoke the DescribeApplicationVersion operation.

        This operation is supported only for Amazon Kinesis Data Analytics for
        Apache Flink.

        :param application_name: The name of the application for which you want to list all versions.
        :param limit: The maximum number of versions to list in this invocation of the
        operation.
        :param next_token: If a previous invocation of this operation returned a pagination token,
        pass it into this value to retrieve the next set of results.
        :returns: ListApplicationVersionsResponse
        :raises InvalidArgumentException:
        :raises ResourceNotFoundException:
        :raises UnsupportedOperationException:
        """
        raise NotImplementedError

    @handler("ListApplications")
    def list_applications(
        self,
        context: RequestContext,
        limit: ListApplicationsInputLimit = None,
        next_token: ApplicationName = None,
    ) -> ListApplicationsResponse:
        """Returns a list of Kinesis Data Analytics applications in your account.
        For each application, the response includes the application name, Amazon
        Resource Name (ARN), and status.

        If you want detailed information about a specific application, use
        DescribeApplication.

        :param limit: The maximum number of applications to list.
        :param next_token: If a previous command returned a pagination token, pass it into this
        value to retrieve the next set of results.
        :returns: ListApplicationsResponse
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("ListTagsForResource")
    def list_tags_for_resource(
        self, context: RequestContext, resource_arn: KinesisAnalyticsARN
    ) -> ListTagsForResourceResponse:
        """Retrieves the list of key-value tags assigned to the application. For
        more information, see `Using
        Tagging <https://docs.aws.amazon.com/kinesisanalytics/latest/java/how-tagging.html>`__.

        :param resource_arn: The ARN of the application for which to retrieve tags.
        :returns: ListTagsForResourceResponse
        :raises ResourceNotFoundException:
        :raises InvalidArgumentException:
        :raises ConcurrentModificationException:
        """
        raise NotImplementedError

    @handler("RollbackApplication")
    def rollback_application(
        self,
        context: RequestContext,
        application_name: ApplicationName,
        current_application_version_id: ApplicationVersionId,
    ) -> RollbackApplicationResponse:
        """Reverts the application to the previous running version. You can roll
        back an application if you suspect it is stuck in a transient status.

        You can roll back an application only if it is in the ``UPDATING`` or
        ``AUTOSCALING`` status.

        When you rollback an application, it loads state data from the last
        successful snapshot. If the application has no snapshots, Kinesis Data
        Analytics rejects the rollback request.

        This action is not supported for Kinesis Data Analytics for SQL
        applications.

        :param application_name: The name of the application.
        :param current_application_version_id: The current application version ID.
        :returns: RollbackApplicationResponse
        :raises ResourceNotFoundException:
        :raises InvalidArgumentException:
        :raises ResourceInUseException:
        :raises InvalidRequestException:
        :raises ConcurrentModificationException:
        :raises UnsupportedOperationException:
        """
        raise NotImplementedError

    @handler("StartApplication")
    def start_application(
        self,
        context: RequestContext,
        application_name: ApplicationName,
        run_configuration: RunConfiguration = None,
    ) -> StartApplicationResponse:
        """Starts the specified Kinesis Data Analytics application. After creating
        an application, you must exclusively call this operation to start your
        application.

        :param application_name: The name of the application.
        :param run_configuration: Identifies the run configuration (start parameters) of a Kinesis Data
        Analytics application.
        :returns: StartApplicationResponse
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises InvalidArgumentException:
        :raises InvalidApplicationConfigurationException:
        :raises InvalidRequestException:
        """
        raise NotImplementedError

    @handler("StopApplication")
    def stop_application(
        self,
        context: RequestContext,
        application_name: ApplicationName,
        force: BooleanObject = None,
    ) -> StopApplicationResponse:
        """Stops the application from processing data. You can stop an application
        only if it is in the running status, unless you set the ``Force``
        parameter to ``true``.

        You can use the DescribeApplication operation to find the application
        status.

        Kinesis Data Analytics takes a snapshot when the application is stopped,
        unless ``Force`` is set to ``true``.

        :param application_name: The name of the running application to stop.
        :param force: Set to ``true`` to force the application to stop.
        :returns: StopApplicationResponse
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises InvalidArgumentException:
        :raises InvalidRequestException:
        :raises InvalidApplicationConfigurationException:
        :raises ConcurrentModificationException:
        """
        raise NotImplementedError

    @handler("TagResource")
    def tag_resource(
        self, context: RequestContext, resource_arn: KinesisAnalyticsARN, tags: Tags
    ) -> TagResourceResponse:
        """Adds one or more key-value tags to a Kinesis Data Analytics application.
        Note that the maximum number of application tags includes system tags.
        The maximum number of user-defined application tags is 50. For more
        information, see `Using
        Tagging <https://docs.aws.amazon.com/kinesisanalytics/latest/java/how-tagging.html>`__.

        :param resource_arn: The ARN of the application to assign the tags.
        :param tags: The key-value tags to assign to the application.
        :returns: TagResourceResponse
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises TooManyTagsException:
        :raises InvalidArgumentException:
        :raises ConcurrentModificationException:
        """
        raise NotImplementedError

    @handler("UntagResource")
    def untag_resource(
        self, context: RequestContext, resource_arn: KinesisAnalyticsARN, tag_keys: TagKeys
    ) -> UntagResourceResponse:
        """Removes one or more tags from a Kinesis Data Analytics application. For
        more information, see `Using
        Tagging <https://docs.aws.amazon.com/kinesisanalytics/latest/java/how-tagging.html>`__.

        :param resource_arn: The ARN of the Kinesis Data Analytics application from which to remove
        the tags.
        :param tag_keys: A list of keys of tags to remove from the specified application.
        :returns: UntagResourceResponse
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises TooManyTagsException:
        :raises InvalidArgumentException:
        :raises ConcurrentModificationException:
        """
        raise NotImplementedError

    @handler("UpdateApplication")
    def update_application(
        self,
        context: RequestContext,
        application_name: ApplicationName,
        current_application_version_id: ApplicationVersionId = None,
        application_configuration_update: ApplicationConfigurationUpdate = None,
        service_execution_role_update: RoleARN = None,
        run_configuration_update: RunConfigurationUpdate = None,
        cloud_watch_logging_option_updates: CloudWatchLoggingOptionUpdates = None,
        conditional_token: ConditionalToken = None,
    ) -> UpdateApplicationResponse:
        """Updates an existing Kinesis Data Analytics application. Using this
        operation, you can update application code, input configuration, and
        output configuration.

        Kinesis Data Analytics updates the ``ApplicationVersionId`` each time
        you update your application.

        You cannot update the ``RuntimeEnvironment`` of an existing application.
        If you need to update an application's ``RuntimeEnvironment``, you must
        delete the application and create it again.

        :param application_name: The name of the application to update.
        :param current_application_version_id: The current application version ID.
        :param application_configuration_update: Describes application configuration updates.
        :param service_execution_role_update: Describes updates to the service execution role.
        :param run_configuration_update: Describes updates to the application's starting parameters.
        :param cloud_watch_logging_option_updates: Describes application Amazon CloudWatch logging option updates.
        :param conditional_token: A value you use to implement strong concurrency for application updates.
        :returns: UpdateApplicationResponse
        :raises CodeValidationException:
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises InvalidArgumentException:
        :raises ConcurrentModificationException:
        :raises InvalidRequestException:
        :raises InvalidApplicationConfigurationException:
        :raises LimitExceededException:
        """
        raise NotImplementedError

    @handler("UpdateApplicationMaintenanceConfiguration")
    def update_application_maintenance_configuration(
        self,
        context: RequestContext,
        application_name: ApplicationName,
        application_maintenance_configuration_update: ApplicationMaintenanceConfigurationUpdate,
    ) -> UpdateApplicationMaintenanceConfigurationResponse:
        """Updates the maintenance configuration of the Kinesis Data Analytics
        application.

        You can invoke this operation on an application that is in one of the
        two following states: ``READY`` or ``RUNNING``. If you invoke it when
        the application is in a state other than these two states, it throws a
        ``ResourceInUseException``. The service makes use of the updated
        configuration the next time it schedules maintenance for the
        application. If you invoke this operation after the service schedules
        maintenance, the service will apply the configuration update the next
        time it schedules maintenance for the application. This means that you
        might not see the maintenance configuration update applied to the
        maintenance process that follows a successful invocation of this
        operation, but to the following maintenance process instead.

        To see the current maintenance configuration of your application, invoke
        the DescribeApplication operation.

        For information about application maintenance, see `Kinesis Data
        Analytics for Apache Flink
        Maintenance <https://docs.aws.amazon.com/kinesisanalytics/latest/java/maintenance.html>`__.

        This operation is supported only for Amazon Kinesis Data Analytics for
        Apache Flink.

        :param application_name: The name of the application for which you want to update the maintenance
        configuration.
        :param application_maintenance_configuration_update: Describes the application maintenance configuration update.
        :returns: UpdateApplicationMaintenanceConfigurationResponse
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises InvalidArgumentException:
        :raises ConcurrentModificationException:
        :raises UnsupportedOperationException:
        """
        raise NotImplementedError
