from datetime import datetime
from typing import List, Optional, TypedDict

from localstack.aws.api import RequestContext, ServiceException, ServiceRequest, handler

ApplicationCode = str
ApplicationDescription = str
ApplicationName = str
BooleanObject = bool
BucketARN = str
ErrorMessage = str
FileKey = str
Id = str
InAppStreamName = str
InAppTableName = str
InputParallelismCount = int
KinesisAnalyticsARN = str
ListApplicationsInputLimit = int
LogStreamARN = str
ParsedInputRecordField = str
ProcessedInputRecord = str
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
TagKey = str
TagValue = str


class ApplicationStatus(str):
    DELETING = "DELETING"
    STARTING = "STARTING"
    STOPPING = "STOPPING"
    READY = "READY"
    RUNNING = "RUNNING"
    UPDATING = "UPDATING"


class InputStartingPosition(str):
    NOW = "NOW"
    TRIM_HORIZON = "TRIM_HORIZON"
    LAST_STOPPED_POINT = "LAST_STOPPED_POINT"


class RecordFormatType(str):
    JSON = "JSON"
    CSV = "CSV"


class CodeValidationException(ServiceException):
    """User-provided application code (query) is invalid. This can be a simple
    syntax error.
    """

    code: str = "CodeValidationException"
    sender_fault: bool = False
    status_code: int = 400


class ConcurrentModificationException(ServiceException):
    """Exception thrown as a result of concurrent modification to an
    application. For example, two individuals attempting to edit the same
    application at the same time.
    """

    code: str = "ConcurrentModificationException"
    sender_fault: bool = False
    status_code: int = 400


class InvalidApplicationConfigurationException(ServiceException):
    """User-provided application configuration is not valid."""

    code: str = "InvalidApplicationConfigurationException"
    sender_fault: bool = False
    status_code: int = 400


class InvalidArgumentException(ServiceException):
    """Specified input parameter value is invalid."""

    code: str = "InvalidArgumentException"
    sender_fault: bool = False
    status_code: int = 400


class LimitExceededException(ServiceException):
    """Exceeded the number of applications allowed."""

    code: str = "LimitExceededException"
    sender_fault: bool = False
    status_code: int = 400


class ResourceInUseException(ServiceException):
    """Application is not available for this operation."""

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
    the Amazon Kinesis Streams ProvisionedThroughputExceededException. For
    more information, see
    `GetRecords <https://docs.aws.amazon.com/kinesis/latest/APIReference/API_GetRecords.html>`__
    in the Amazon Kinesis Streams API Reference.
    """

    code: str = "ResourceProvisionedThroughputExceededException"
    sender_fault: bool = False
    status_code: int = 400


class ServiceUnavailableException(ServiceException):
    """The service is unavailable. Back off and retry the operation."""

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
    """Data format is not valid. Amazon Kinesis Analytics is not able to detect
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
    """Provides a description of CloudWatch logging options, including the log
    stream Amazon Resource Name (ARN) and the role ARN.
    """

    LogStreamARN: LogStreamARN
    RoleARN: RoleARN


ApplicationVersionId = int


class AddApplicationCloudWatchLoggingOptionRequest(ServiceRequest):
    ApplicationName: ApplicationName
    CurrentApplicationVersionId: ApplicationVersionId
    CloudWatchLoggingOption: CloudWatchLoggingOption


class AddApplicationCloudWatchLoggingOptionResponse(TypedDict, total=False):
    pass


class InputLambdaProcessor(TypedDict, total=False):
    """An object that contains the Amazon Resource Name (ARN) of the `AWS
    Lambda <https://docs.aws.amazon.com/lambda/>`__ function that is used to
    preprocess records in the stream, and the ARN of the IAM role that is
    used to access the AWS Lambda function.
    """

    ResourceARN: ResourceARN
    RoleARN: RoleARN


class InputProcessingConfiguration(TypedDict, total=False):
    """Provides a description of a processor that is used to preprocess the
    records in the stream before being processed by your application code.
    Currently, the only input processor available is `AWS
    Lambda <https://docs.aws.amazon.com/lambda/>`__.
    """

    InputLambdaProcessor: InputLambdaProcessor


class AddApplicationInputProcessingConfigurationRequest(ServiceRequest):
    ApplicationName: ApplicationName
    CurrentApplicationVersionId: ApplicationVersionId
    InputId: Id
    InputProcessingConfiguration: InputProcessingConfiguration


class AddApplicationInputProcessingConfigurationResponse(TypedDict, total=False):
    pass


class RecordColumn(TypedDict, total=False):
    """Describes the mapping of each data element in the streaming source to
    the corresponding column in the in-application stream.

    Also used to describe the format of the reference data source.
    """

    Name: RecordColumnName
    Mapping: Optional[RecordColumnMapping]
    SqlType: RecordColumnSqlType


RecordColumns = List[RecordColumn]


class CSVMappingParameters(TypedDict, total=False):
    """Provides additional mapping information when the record format uses
    delimiters, such as CSV. For example, the following sample records use
    CSV format, where the records use the *'\\n'* as the row delimiter and a
    comma (",") as the column delimiter:

    ``"name1", "address1"``

    ``"name2", "address2"``
    """

    RecordRowDelimiter: RecordRowDelimiter
    RecordColumnDelimiter: RecordColumnDelimiter


class JSONMappingParameters(TypedDict, total=False):
    """Provides additional mapping information when JSON is the record format
    on the streaming source.
    """

    RecordRowPath: RecordRowPath


class MappingParameters(TypedDict, total=False):
    """When configuring application input at the time of creating or updating
    an application, provides additional mapping information specific to the
    record format (such as JSON, CSV, or record fields delimited by some
    delimiter) on the streaming source.
    """

    JSONMappingParameters: Optional[JSONMappingParameters]
    CSVMappingParameters: Optional[CSVMappingParameters]


class RecordFormat(TypedDict, total=False):
    """Describes the record format and relevant mapping information that should
    be applied to schematize the records on the stream.
    """

    RecordFormatType: RecordFormatType
    MappingParameters: Optional[MappingParameters]


class SourceSchema(TypedDict, total=False):
    """Describes the format of the data in the streaming source, and how each
    data element maps to corresponding columns created in the in-application
    stream.
    """

    RecordFormat: RecordFormat
    RecordEncoding: Optional[RecordEncoding]
    RecordColumns: RecordColumns


class InputParallelism(TypedDict, total=False):
    """Describes the number of in-application streams to create for a given
    streaming source. For information about parallelism, see `Configuring
    Application
    Input <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/how-it-works-input.html>`__.
    """

    Count: Optional[InputParallelismCount]


class KinesisFirehoseInput(TypedDict, total=False):
    """Identifies an Amazon Kinesis Firehose delivery stream as the streaming
    source. You provide the delivery stream's Amazon Resource Name (ARN) and
    an IAM role ARN that enables Amazon Kinesis Analytics to access the
    stream on your behalf.
    """

    ResourceARN: ResourceARN
    RoleARN: RoleARN


class KinesisStreamsInput(TypedDict, total=False):
    """Identifies an Amazon Kinesis stream as the streaming source. You provide
    the stream's Amazon Resource Name (ARN) and an IAM role ARN that enables
    Amazon Kinesis Analytics to access the stream on your behalf.
    """

    ResourceARN: ResourceARN
    RoleARN: RoleARN


class Input(TypedDict, total=False):
    """When you configure the application input, you specify the streaming
    source, the in-application stream name that is created, and the mapping
    between the two. For more information, see `Configuring Application
    Input <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/how-it-works-input.html>`__.
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


class AddApplicationInputResponse(TypedDict, total=False):
    pass


class DestinationSchema(TypedDict, total=False):
    """Describes the data format when records are written to the destination.
    For more information, see `Configuring Application
    Output <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/how-it-works-output.html>`__.
    """

    RecordFormatType: RecordFormatType


class LambdaOutput(TypedDict, total=False):
    """When configuring application output, identifies an AWS Lambda function
    as the destination. You provide the function Amazon Resource Name (ARN)
    and also an IAM role ARN that Amazon Kinesis Analytics can use to write
    to the function on your behalf.
    """

    ResourceARN: ResourceARN
    RoleARN: RoleARN


class KinesisFirehoseOutput(TypedDict, total=False):
    """When configuring application output, identifies an Amazon Kinesis
    Firehose delivery stream as the destination. You provide the stream
    Amazon Resource Name (ARN) and an IAM role that enables Amazon Kinesis
    Analytics to write to the stream on your behalf.
    """

    ResourceARN: ResourceARN
    RoleARN: RoleARN


class KinesisStreamsOutput(TypedDict, total=False):
    """When configuring application output, identifies an Amazon Kinesis stream
    as the destination. You provide the stream Amazon Resource Name (ARN)
    and also an IAM role ARN that Amazon Kinesis Analytics can use to write
    to the stream on your behalf.
    """

    ResourceARN: ResourceARN
    RoleARN: RoleARN


class Output(TypedDict, total=False):
    """Describes application output configuration in which you identify an
    in-application stream and a destination where you want the
    in-application stream data to be written. The destination can be an
    Amazon Kinesis stream or an Amazon Kinesis Firehose delivery stream.

    For limits on how many destinations an application can write and other
    limitations, see
    `Limits <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/limits.html>`__.
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


class AddApplicationOutputResponse(TypedDict, total=False):
    pass


class S3ReferenceDataSource(TypedDict, total=False):
    """Identifies the S3 bucket and object that contains the reference data.
    Also identifies the IAM role Amazon Kinesis Analytics can assume to read
    this object on your behalf.

    An Amazon Kinesis Analytics application loads reference data only once.
    If the data changes, you call the
    `UpdateApplication <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/API_UpdateApplication.html>`__
    operation to trigger reloading of data into your application.
    """

    BucketARN: BucketARN
    FileKey: FileKey
    ReferenceRoleARN: RoleARN


class ReferenceDataSource(TypedDict, total=False):
    """Describes the reference data source by providing the source information
    (S3 bucket name and object key name), the resulting in-application table
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


class AddApplicationReferenceDataSourceResponse(TypedDict, total=False):
    pass


class CloudWatchLoggingOptionDescription(TypedDict, total=False):
    """Description of the CloudWatch logging option."""

    CloudWatchLoggingOptionId: Optional[Id]
    LogStreamARN: LogStreamARN
    RoleARN: RoleARN


CloudWatchLoggingOptionDescriptions = List[CloudWatchLoggingOptionDescription]


class S3ReferenceDataSourceDescription(TypedDict, total=False):
    """Provides the bucket name and object key name that stores the reference
    data.
    """

    BucketARN: BucketARN
    FileKey: FileKey
    ReferenceRoleARN: RoleARN


class ReferenceDataSourceDescription(TypedDict, total=False):
    """Describes the reference data source configured for an application."""

    ReferenceId: Id
    TableName: InAppTableName
    S3ReferenceDataSourceDescription: S3ReferenceDataSourceDescription
    ReferenceSchema: Optional[SourceSchema]


ReferenceDataSourceDescriptions = List[ReferenceDataSourceDescription]


class LambdaOutputDescription(TypedDict, total=False):
    """For an application output, describes the AWS Lambda function configured
    as its destination.
    """

    ResourceARN: Optional[ResourceARN]
    RoleARN: Optional[RoleARN]


class KinesisFirehoseOutputDescription(TypedDict, total=False):
    """For an application output, describes the Amazon Kinesis Firehose
    delivery stream configured as its destination.
    """

    ResourceARN: Optional[ResourceARN]
    RoleARN: Optional[RoleARN]


class KinesisStreamsOutputDescription(TypedDict, total=False):
    """For an application output, describes the Amazon Kinesis stream
    configured as its destination.
    """

    ResourceARN: Optional[ResourceARN]
    RoleARN: Optional[RoleARN]


class OutputDescription(TypedDict, total=False):
    """Describes the application output configuration, which includes the
    in-application stream name and the destination where the stream data is
    written. The destination can be an Amazon Kinesis stream or an Amazon
    Kinesis Firehose delivery stream.
    """

    OutputId: Optional[Id]
    Name: Optional[InAppStreamName]
    KinesisStreamsOutputDescription: Optional[KinesisStreamsOutputDescription]
    KinesisFirehoseOutputDescription: Optional[KinesisFirehoseOutputDescription]
    LambdaOutputDescription: Optional[LambdaOutputDescription]
    DestinationSchema: Optional[DestinationSchema]


OutputDescriptions = List[OutputDescription]


class InputStartingPositionConfiguration(TypedDict, total=False):
    """Describes the point at which the application reads from the streaming
    source.
    """

    InputStartingPosition: Optional[InputStartingPosition]


class KinesisFirehoseInputDescription(TypedDict, total=False):
    """Describes the Amazon Kinesis Firehose delivery stream that is configured
    as the streaming source in the application input configuration.
    """

    ResourceARN: Optional[ResourceARN]
    RoleARN: Optional[RoleARN]


class KinesisStreamsInputDescription(TypedDict, total=False):
    """Describes the Amazon Kinesis stream that is configured as the streaming
    source in the application input configuration.
    """

    ResourceARN: Optional[ResourceARN]
    RoleARN: Optional[RoleARN]


class InputLambdaProcessorDescription(TypedDict, total=False):
    """An object that contains the Amazon Resource Name (ARN) of the `AWS
    Lambda <https://docs.aws.amazon.com/lambda/>`__ function that is used to
    preprocess records in the stream, and the ARN of the IAM role that is
    used to access the AWS Lambda expression.
    """

    ResourceARN: Optional[ResourceARN]
    RoleARN: Optional[RoleARN]


class InputProcessingConfigurationDescription(TypedDict, total=False):
    """Provides configuration information about an input processor. Currently,
    the only input processor available is `AWS
    Lambda <https://docs.aws.amazon.com/lambda/>`__.
    """

    InputLambdaProcessorDescription: Optional[InputLambdaProcessorDescription]


InAppStreamNames = List[InAppStreamName]


class InputDescription(TypedDict, total=False):
    """Describes the application input configuration. For more information, see
    `Configuring Application
    Input <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/how-it-works-input.html>`__.
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
Timestamp = datetime


class ApplicationDetail(TypedDict, total=False):
    """This documentation is for version 1 of the Amazon Kinesis Data Analytics
    API, which only supports SQL applications. Version 2 of the API supports
    SQL and Java applications. For more information about version 2, see
    `Amazon Kinesis Data Analytics API V2
    Documentation </kinesisanalytics/latest/apiv2/Welcome.html>`__.

    Provides a description of the application, including the application
    Amazon Resource Name (ARN), status, latest version, and input and output
    configuration.
    """

    ApplicationName: ApplicationName
    ApplicationDescription: Optional[ApplicationDescription]
    ApplicationARN: ResourceARN
    ApplicationStatus: ApplicationStatus
    CreateTimestamp: Optional[Timestamp]
    LastUpdateTimestamp: Optional[Timestamp]
    InputDescriptions: Optional[InputDescriptions]
    OutputDescriptions: Optional[OutputDescriptions]
    ReferenceDataSourceDescriptions: Optional[ReferenceDataSourceDescriptions]
    CloudWatchLoggingOptionDescriptions: Optional[CloudWatchLoggingOptionDescriptions]
    ApplicationCode: Optional[ApplicationCode]
    ApplicationVersionId: ApplicationVersionId


class ApplicationSummary(TypedDict, total=False):
    """This documentation is for version 1 of the Amazon Kinesis Data Analytics
    API, which only supports SQL applications. Version 2 of the API supports
    SQL and Java applications. For more information about version 2, see
    `Amazon Kinesis Data Analytics API V2
    Documentation </kinesisanalytics/latest/apiv2/Welcome.html>`__.

    Provides application summary information, including the application
    Amazon Resource Name (ARN), name, and status.
    """

    ApplicationName: ApplicationName
    ApplicationARN: ResourceARN
    ApplicationStatus: ApplicationStatus


ApplicationSummaries = List[ApplicationSummary]


class CloudWatchLoggingOptionUpdate(TypedDict, total=False):
    """Describes CloudWatch logging option updates."""

    CloudWatchLoggingOptionId: Id
    LogStreamARNUpdate: Optional[LogStreamARN]
    RoleARNUpdate: Optional[RoleARN]


CloudWatchLoggingOptionUpdates = List[CloudWatchLoggingOptionUpdate]


class S3ReferenceDataSourceUpdate(TypedDict, total=False):
    """Describes the S3 bucket name, object key name, and IAM role that Amazon
    Kinesis Analytics can assume to read the Amazon S3 object on your behalf
    and populate the in-application reference table.
    """

    BucketARNUpdate: Optional[BucketARN]
    FileKeyUpdate: Optional[FileKey]
    ReferenceRoleARNUpdate: Optional[RoleARN]


class ReferenceDataSourceUpdate(TypedDict, total=False):
    """When you update a reference data source configuration for an
    application, this object provides all the updated values (such as the
    source bucket name and object key name), the in-application table name
    that is created, and updated mapping information that maps the data in
    the Amazon S3 object to the in-application reference table that is
    created.
    """

    ReferenceId: Id
    TableNameUpdate: Optional[InAppTableName]
    S3ReferenceDataSourceUpdate: Optional[S3ReferenceDataSourceUpdate]
    ReferenceSchemaUpdate: Optional[SourceSchema]


ReferenceDataSourceUpdates = List[ReferenceDataSourceUpdate]


class LambdaOutputUpdate(TypedDict, total=False):
    """When updating an output configuration using the
    `UpdateApplication <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/API_UpdateApplication.html>`__
    operation, provides information about an AWS Lambda function configured
    as the destination.
    """

    ResourceARNUpdate: Optional[ResourceARN]
    RoleARNUpdate: Optional[RoleARN]


class KinesisFirehoseOutputUpdate(TypedDict, total=False):
    """When updating an output configuration using the
    `UpdateApplication <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/API_UpdateApplication.html>`__
    operation, provides information about an Amazon Kinesis Firehose
    delivery stream configured as the destination.
    """

    ResourceARNUpdate: Optional[ResourceARN]
    RoleARNUpdate: Optional[RoleARN]


class KinesisStreamsOutputUpdate(TypedDict, total=False):
    """When updating an output configuration using the
    `UpdateApplication <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/API_UpdateApplication.html>`__
    operation, provides information about an Amazon Kinesis stream
    configured as the destination.
    """

    ResourceARNUpdate: Optional[ResourceARN]
    RoleARNUpdate: Optional[RoleARN]


class OutputUpdate(TypedDict, total=False):
    """Describes updates to the output configuration identified by the
    ``OutputId``.
    """

    OutputId: Id
    NameUpdate: Optional[InAppStreamName]
    KinesisStreamsOutputUpdate: Optional[KinesisStreamsOutputUpdate]
    KinesisFirehoseOutputUpdate: Optional[KinesisFirehoseOutputUpdate]
    LambdaOutputUpdate: Optional[LambdaOutputUpdate]
    DestinationSchemaUpdate: Optional[DestinationSchema]


OutputUpdates = List[OutputUpdate]


class InputParallelismUpdate(TypedDict, total=False):
    """Provides updates to the parallelism count."""

    CountUpdate: Optional[InputParallelismCount]


class InputSchemaUpdate(TypedDict, total=False):
    """Describes updates for the application's input schema."""

    RecordFormatUpdate: Optional[RecordFormat]
    RecordEncodingUpdate: Optional[RecordEncoding]
    RecordColumnUpdates: Optional[RecordColumns]


class KinesisFirehoseInputUpdate(TypedDict, total=False):
    """When updating application input configuration, provides information
    about an Amazon Kinesis Firehose delivery stream as the streaming
    source.
    """

    ResourceARNUpdate: Optional[ResourceARN]
    RoleARNUpdate: Optional[RoleARN]


class KinesisStreamsInputUpdate(TypedDict, total=False):
    """When updating application input configuration, provides information
    about an Amazon Kinesis stream as the streaming source.
    """

    ResourceARNUpdate: Optional[ResourceARN]
    RoleARNUpdate: Optional[RoleARN]


class InputLambdaProcessorUpdate(TypedDict, total=False):
    """Represents an update to the
    `InputLambdaProcessor <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/API_InputLambdaProcessor.html>`__
    that is used to preprocess the records in the stream.
    """

    ResourceARNUpdate: Optional[ResourceARN]
    RoleARNUpdate: Optional[RoleARN]


class InputProcessingConfigurationUpdate(TypedDict, total=False):
    """Describes updates to an
    `InputProcessingConfiguration <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/API_InputProcessingConfiguration.html>`__.
    """

    InputLambdaProcessorUpdate: InputLambdaProcessorUpdate


class InputUpdate(TypedDict, total=False):
    """Describes updates to a specific input configuration (identified by the
    ``InputId`` of an application).
    """

    InputId: Id
    NamePrefixUpdate: Optional[InAppStreamName]
    InputProcessingConfigurationUpdate: Optional[InputProcessingConfigurationUpdate]
    KinesisStreamsInputUpdate: Optional[KinesisStreamsInputUpdate]
    KinesisFirehoseInputUpdate: Optional[KinesisFirehoseInputUpdate]
    InputSchemaUpdate: Optional[InputSchemaUpdate]
    InputParallelismUpdate: Optional[InputParallelismUpdate]


InputUpdates = List[InputUpdate]


class ApplicationUpdate(TypedDict, total=False):
    """Describes updates to apply to an existing Amazon Kinesis Analytics
    application.
    """

    InputUpdates: Optional[InputUpdates]
    ApplicationCodeUpdate: Optional[ApplicationCode]
    OutputUpdates: Optional[OutputUpdates]
    ReferenceDataSourceUpdates: Optional[ReferenceDataSourceUpdates]
    CloudWatchLoggingOptionUpdates: Optional[CloudWatchLoggingOptionUpdates]


CloudWatchLoggingOptions = List[CloudWatchLoggingOption]


class Tag(TypedDict, total=False):
    """A key-value pair (the value is optional) that you can define and assign
    to AWS resources. If you specify a tag that already exists, the tag
    value is replaced with the value that you specify in the request. Note
    that the maximum number of application tags includes system tags. The
    maximum number of user-defined application tags is 50. For more
    information, see `Using
    Tagging <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/how-tagging.html>`__.
    """

    Key: TagKey
    Value: Optional[TagValue]


Tags = List[Tag]
Outputs = List[Output]
Inputs = List[Input]


class CreateApplicationRequest(ServiceRequest):
    """TBD"""

    ApplicationName: ApplicationName
    ApplicationDescription: Optional[ApplicationDescription]
    Inputs: Optional[Inputs]
    Outputs: Optional[Outputs]
    CloudWatchLoggingOptions: Optional[CloudWatchLoggingOptions]
    ApplicationCode: Optional[ApplicationCode]
    Tags: Optional[Tags]


class CreateApplicationResponse(TypedDict, total=False):
    """TBD"""

    ApplicationSummary: ApplicationSummary


class DeleteApplicationCloudWatchLoggingOptionRequest(ServiceRequest):
    ApplicationName: ApplicationName
    CurrentApplicationVersionId: ApplicationVersionId
    CloudWatchLoggingOptionId: Id


class DeleteApplicationCloudWatchLoggingOptionResponse(TypedDict, total=False):
    pass


class DeleteApplicationInputProcessingConfigurationRequest(ServiceRequest):
    ApplicationName: ApplicationName
    CurrentApplicationVersionId: ApplicationVersionId
    InputId: Id


class DeleteApplicationInputProcessingConfigurationResponse(TypedDict, total=False):
    pass


class DeleteApplicationOutputRequest(ServiceRequest):
    ApplicationName: ApplicationName
    CurrentApplicationVersionId: ApplicationVersionId
    OutputId: Id


class DeleteApplicationOutputResponse(TypedDict, total=False):
    pass


class DeleteApplicationReferenceDataSourceRequest(ServiceRequest):
    ApplicationName: ApplicationName
    CurrentApplicationVersionId: ApplicationVersionId
    ReferenceId: Id


class DeleteApplicationReferenceDataSourceResponse(TypedDict, total=False):
    pass


class DeleteApplicationRequest(ServiceRequest):
    ApplicationName: ApplicationName
    CreateTimestamp: Timestamp


class DeleteApplicationResponse(TypedDict, total=False):
    pass


class DescribeApplicationRequest(ServiceRequest):
    ApplicationName: ApplicationName


class DescribeApplicationResponse(TypedDict, total=False):
    ApplicationDetail: ApplicationDetail


class S3Configuration(TypedDict, total=False):
    """Provides a description of an Amazon S3 data source, including the Amazon
    Resource Name (ARN) of the S3 bucket, the ARN of the IAM role that is
    used to access the bucket, and the name of the Amazon S3 object that
    contains the data.
    """

    RoleARN: RoleARN
    BucketARN: BucketARN
    FileKey: FileKey


class DiscoverInputSchemaRequest(ServiceRequest):
    ResourceARN: Optional[ResourceARN]
    RoleARN: Optional[RoleARN]
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


class InputConfiguration(TypedDict, total=False):
    """When you start your application, you provide this configuration, which
    identifies the input source and the point in the input source at which
    you want the application to start processing records.
    """

    Id: Id
    InputStartingPositionConfiguration: InputStartingPositionConfiguration


InputConfigurations = List[InputConfiguration]


class ListApplicationsRequest(ServiceRequest):
    Limit: Optional[ListApplicationsInputLimit]
    ExclusiveStartApplicationName: Optional[ApplicationName]


class ListApplicationsResponse(TypedDict, total=False):
    ApplicationSummaries: ApplicationSummaries
    HasMoreApplications: BooleanObject


class ListTagsForResourceRequest(ServiceRequest):
    ResourceARN: KinesisAnalyticsARN


class ListTagsForResourceResponse(TypedDict, total=False):
    Tags: Optional[Tags]


class StartApplicationRequest(ServiceRequest):
    ApplicationName: ApplicationName
    InputConfigurations: InputConfigurations


class StartApplicationResponse(TypedDict, total=False):
    pass


class StopApplicationRequest(ServiceRequest):
    ApplicationName: ApplicationName


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


class UpdateApplicationRequest(ServiceRequest):
    ApplicationName: ApplicationName
    CurrentApplicationVersionId: ApplicationVersionId
    ApplicationUpdate: ApplicationUpdate


class UpdateApplicationResponse(TypedDict, total=False):
    pass


class KinesisanalyticsApi:
    service = "kinesisanalytics"
    version = "2015-08-14"

    @handler("AddApplicationCloudWatchLoggingOption")
    def add_application_cloud_watch_logging_option(
        self,
        context: RequestContext,
        application_name: ApplicationName,
        current_application_version_id: ApplicationVersionId,
        cloud_watch_logging_option: CloudWatchLoggingOption,
    ) -> AddApplicationCloudWatchLoggingOptionResponse:
        """This documentation is for version 1 of the Amazon Kinesis Data Analytics
        API, which only supports SQL applications. Version 2 of the API supports
        SQL and Java applications. For more information about version 2, see
        `Amazon Kinesis Data Analytics API V2
        Documentation </kinesisanalytics/latest/apiv2/Welcome.html>`__.

        Adds a CloudWatch log stream to monitor application configuration
        errors. For more information about using CloudWatch log streams with
        Amazon Kinesis Analytics applications, see `Working with Amazon
        CloudWatch
        Logs <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/cloudwatch-logs.html>`__.

        :param application_name: The Kinesis Analytics application name.
        :param current_application_version_id: The version ID of the Kinesis Analytics application.
        :param cloud_watch_logging_option: Provides the CloudWatch log stream Amazon Resource Name (ARN) and the
        IAM role ARN.
        :returns: AddApplicationCloudWatchLoggingOptionResponse
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises InvalidArgumentException:
        :raises ConcurrentModificationException:
        :raises UnsupportedOperationException:
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
        """This documentation is for version 1 of the Amazon Kinesis Data Analytics
        API, which only supports SQL applications. Version 2 of the API supports
        SQL and Java applications. For more information about version 2, see
        `Amazon Kinesis Data Analytics API V2
        Documentation </kinesisanalytics/latest/apiv2/Welcome.html>`__.

        Adds a streaming source to your Amazon Kinesis application. For
        conceptual information, see `Configuring Application
        Input <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/how-it-works-input.html>`__.

        You can add a streaming source either when you create an application or
        you can use this operation to add a streaming source after you create an
        application. For more information, see
        `CreateApplication <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/API_CreateApplication.html>`__.

        Any configuration update, including adding a streaming source using this
        operation, results in a new version of the application. You can use the
        `DescribeApplication <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/API_DescribeApplication.html>`__
        operation to find the current application version.

        This operation requires permissions to perform the
        ``kinesisanalytics:AddApplicationInput`` action.

        :param application_name: Name of your existing Amazon Kinesis Analytics application to which you
        want to add the streaming source.
        :param current_application_version_id: Current version of your Amazon Kinesis Analytics application.
        :param input: The
        `Input <https://docs.
        :returns: AddApplicationInputResponse
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises InvalidArgumentException:
        :raises ConcurrentModificationException:
        :raises CodeValidationException:
        :raises UnsupportedOperationException:
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
        """This documentation is for version 1 of the Amazon Kinesis Data Analytics
        API, which only supports SQL applications. Version 2 of the API supports
        SQL and Java applications. For more information about version 2, see
        `Amazon Kinesis Data Analytics API V2
        Documentation </kinesisanalytics/latest/apiv2/Welcome.html>`__.

        Adds an
        `InputProcessingConfiguration <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/API_InputProcessingConfiguration.html>`__
        to an application. An input processor preprocesses records on the input
        stream before the application's SQL code executes. Currently, the only
        input processor available is `AWS
        Lambda <https://docs.aws.amazon.com/lambda/>`__.

        :param application_name: Name of the application to which you want to add the input processing
        configuration.
        :param current_application_version_id: Version of the application to which you want to add the input processing
        configuration.
        :param input_id: The ID of the input configuration to add the input processing
        configuration to.
        :param input_processing_configuration: The
        `InputProcessingConfiguration <https://docs.
        :returns: AddApplicationInputProcessingConfigurationResponse
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises InvalidArgumentException:
        :raises ConcurrentModificationException:
        :raises UnsupportedOperationException:
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
        """This documentation is for version 1 of the Amazon Kinesis Data Analytics
        API, which only supports SQL applications. Version 2 of the API supports
        SQL and Java applications. For more information about version 2, see
        `Amazon Kinesis Data Analytics API V2
        Documentation </kinesisanalytics/latest/apiv2/Welcome.html>`__.

        Adds an external destination to your Amazon Kinesis Analytics
        application.

        If you want Amazon Kinesis Analytics to deliver data from an
        in-application stream within your application to an external destination
        (such as an Amazon Kinesis stream, an Amazon Kinesis Firehose delivery
        stream, or an AWS Lambda function), you add the relevant configuration
        to your application using this operation. You can configure one or more
        outputs for your application. Each output configuration maps an
        in-application stream and an external destination.

        You can use one of the output configurations to deliver data from your
        in-application error stream to an external destination so that you can
        analyze the errors. For more information, see `Understanding Application
        Output
        (Destination) <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/how-it-works-output.html>`__.

        Any configuration update, including adding a streaming source using this
        operation, results in a new version of the application. You can use the
        `DescribeApplication <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/API_DescribeApplication.html>`__
        operation to find the current application version.

        For the limits on the number of application inputs and outputs you can
        configure, see
        `Limits <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/limits.html>`__.

        This operation requires permissions to perform the
        ``kinesisanalytics:AddApplicationOutput`` action.

        :param application_name: Name of the application to which you want to add the output
        configuration.
        :param current_application_version_id: Version of the application to which you want to add the output
        configuration.
        :param output: An array of objects, each describing one output configuration.
        :returns: AddApplicationOutputResponse
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises InvalidArgumentException:
        :raises ConcurrentModificationException:
        :raises UnsupportedOperationException:
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
        """This documentation is for version 1 of the Amazon Kinesis Data Analytics
        API, which only supports SQL applications. Version 2 of the API supports
        SQL and Java applications. For more information about version 2, see
        `Amazon Kinesis Data Analytics API V2
        Documentation </kinesisanalytics/latest/apiv2/Welcome.html>`__.

        Adds a reference data source to an existing application.

        Amazon Kinesis Analytics reads reference data (that is, an Amazon S3
        object) and creates an in-application table within your application. In
        the request, you provide the source (S3 bucket name and object key
        name), name of the in-application table to create, and the necessary
        mapping information that describes how data in Amazon S3 object maps to
        columns in the resulting in-application table.

        For conceptual information, see `Configuring Application
        Input <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/how-it-works-input.html>`__.
        For the limits on data sources you can add to your application, see
        `Limits <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/limits.html>`__.

        This operation requires permissions to perform the
        ``kinesisanalytics:AddApplicationOutput`` action.

        :param application_name: Name of an existing application.
        :param current_application_version_id: Version of the application for which you are adding the reference data
        source.
        :param reference_data_source: The reference data source can be an object in your Amazon S3 bucket.
        :returns: AddApplicationReferenceDataSourceResponse
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises InvalidArgumentException:
        :raises ConcurrentModificationException:
        :raises UnsupportedOperationException:
        """
        raise NotImplementedError

    @handler("CreateApplication")
    def create_application(
        self,
        context: RequestContext,
        application_name: ApplicationName,
        application_description: ApplicationDescription = None,
        inputs: Inputs = None,
        outputs: Outputs = None,
        cloud_watch_logging_options: CloudWatchLoggingOptions = None,
        application_code: ApplicationCode = None,
        tags: Tags = None,
    ) -> CreateApplicationResponse:
        """This documentation is for version 1 of the Amazon Kinesis Data Analytics
        API, which only supports SQL applications. Version 2 of the API supports
        SQL and Java applications. For more information about version 2, see
        `Amazon Kinesis Data Analytics API V2
        Documentation </kinesisanalytics/latest/apiv2/Welcome.html>`__.

        Creates an Amazon Kinesis Analytics application. You can configure each
        application with one streaming source as input, application code to
        process the input, and up to three destinations where you want Amazon
        Kinesis Analytics to write the output data from your application. For an
        overview, see `How it
        Works <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/how-it-works.html>`__.

        In the input configuration, you map the streaming source to an
        in-application stream, which you can think of as a constantly updating
        table. In the mapping, you must provide a schema for the in-application
        stream and map each data column in the in-application stream to a data
        element in the streaming source.

        Your application code is one or more SQL statements that read input
        data, transform it, and generate output. Your application code can
        create one or more SQL artifacts like SQL streams or pumps.

        In the output configuration, you can configure the application to write
        data from in-application streams created in your applications to up to
        three destinations.

        To read data from your source stream or write data to destination
        streams, Amazon Kinesis Analytics needs your permissions. You grant
        these permissions by creating IAM roles. This operation requires
        permissions to perform the ``kinesisanalytics:CreateApplication``
        action.

        For introductory exercises to create an Amazon Kinesis Analytics
        application, see `Getting
        Started <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/getting-started.html>`__.

        :param application_name: Name of your Amazon Kinesis Analytics application (for example,
        ``sample-app``).
        :param application_description: Summary description of the application.
        :param inputs: Use this parameter to configure the application input.
        :param outputs: You can configure application output to write data from any of the
        in-application streams to up to three destinations.
        :param cloud_watch_logging_options: Use this parameter to configure a CloudWatch log stream to monitor
        application configuration errors.
        :param application_code: One or more SQL statements that read input data, transform it, and
        generate output.
        :param tags: A list of one or more tags to assign to the application.
        :returns: CreateApplicationResponse
        :raises CodeValidationException:
        :raises ResourceInUseException:
        :raises LimitExceededException:
        :raises InvalidArgumentException:
        :raises TooManyTagsException:
        :raises ConcurrentModificationException:
        """
        raise NotImplementedError

    @handler("DeleteApplication")
    def delete_application(
        self,
        context: RequestContext,
        application_name: ApplicationName,
        create_timestamp: Timestamp,
    ) -> DeleteApplicationResponse:
        """This documentation is for version 1 of the Amazon Kinesis Data Analytics
        API, which only supports SQL applications. Version 2 of the API supports
        SQL and Java applications. For more information about version 2, see
        `Amazon Kinesis Data Analytics API V2
        Documentation </kinesisanalytics/latest/apiv2/Welcome.html>`__.

        Deletes the specified application. Amazon Kinesis Analytics halts
        application execution and deletes the application, including any
        application artifacts (such as in-application streams, reference table,
        and application code).

        This operation requires permissions to perform the
        ``kinesisanalytics:DeleteApplication`` action.

        :param application_name: Name of the Amazon Kinesis Analytics application to delete.
        :param create_timestamp: You can use the ``DescribeApplication`` operation to get this value.
        :returns: DeleteApplicationResponse
        :raises ConcurrentModificationException:
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises UnsupportedOperationException:
        """
        raise NotImplementedError

    @handler("DeleteApplicationCloudWatchLoggingOption")
    def delete_application_cloud_watch_logging_option(
        self,
        context: RequestContext,
        application_name: ApplicationName,
        current_application_version_id: ApplicationVersionId,
        cloud_watch_logging_option_id: Id,
    ) -> DeleteApplicationCloudWatchLoggingOptionResponse:
        """This documentation is for version 1 of the Amazon Kinesis Data Analytics
        API, which only supports SQL applications. Version 2 of the API supports
        SQL and Java applications. For more information about version 2, see
        `Amazon Kinesis Data Analytics API V2
        Documentation </kinesisanalytics/latest/apiv2/Welcome.html>`__.

        Deletes a CloudWatch log stream from an application. For more
        information about using CloudWatch log streams with Amazon Kinesis
        Analytics applications, see `Working with Amazon CloudWatch
        Logs <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/cloudwatch-logs.html>`__.

        :param application_name: The Kinesis Analytics application name.
        :param current_application_version_id: The version ID of the Kinesis Analytics application.
        :param cloud_watch_logging_option_id: The ``CloudWatchLoggingOptionId`` of the CloudWatch logging option to
        delete.
        :returns: DeleteApplicationCloudWatchLoggingOptionResponse
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises InvalidArgumentException:
        :raises ConcurrentModificationException:
        :raises UnsupportedOperationException:
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
        """This documentation is for version 1 of the Amazon Kinesis Data Analytics
        API, which only supports SQL applications. Version 2 of the API supports
        SQL and Java applications. For more information about version 2, see
        `Amazon Kinesis Data Analytics API V2
        Documentation </kinesisanalytics/latest/apiv2/Welcome.html>`__.

        Deletes an
        `InputProcessingConfiguration <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/API_InputProcessingConfiguration.html>`__
        from an input.

        :param application_name: The Kinesis Analytics application name.
        :param current_application_version_id: The version ID of the Kinesis Analytics application.
        :param input_id: The ID of the input configuration from which to delete the input
        processing configuration.
        :returns: DeleteApplicationInputProcessingConfigurationResponse
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises InvalidArgumentException:
        :raises ConcurrentModificationException:
        :raises UnsupportedOperationException:
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
        """This documentation is for version 1 of the Amazon Kinesis Data Analytics
        API, which only supports SQL applications. Version 2 of the API supports
        SQL and Java applications. For more information about version 2, see
        `Amazon Kinesis Data Analytics API V2
        Documentation </kinesisanalytics/latest/apiv2/Welcome.html>`__.

        Deletes output destination configuration from your application
        configuration. Amazon Kinesis Analytics will no longer write data from
        the corresponding in-application stream to the external output
        destination.

        This operation requires permissions to perform the
        ``kinesisanalytics:DeleteApplicationOutput`` action.

        :param application_name: Amazon Kinesis Analytics application name.
        :param current_application_version_id: Amazon Kinesis Analytics application version.
        :param output_id: The ID of the configuration to delete.
        :returns: DeleteApplicationOutputResponse
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises InvalidArgumentException:
        :raises ConcurrentModificationException:
        :raises UnsupportedOperationException:
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
        """This documentation is for version 1 of the Amazon Kinesis Data Analytics
        API, which only supports SQL applications. Version 2 of the API supports
        SQL and Java applications. For more information about version 2, see
        `Amazon Kinesis Data Analytics API V2
        Documentation </kinesisanalytics/latest/apiv2/Welcome.html>`__.

        Deletes a reference data source configuration from the specified
        application configuration.

        If the application is running, Amazon Kinesis Analytics immediately
        removes the in-application table that you created using the
        `AddApplicationReferenceDataSource <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/API_AddApplicationReferenceDataSource.html>`__
        operation.

        This operation requires permissions to perform the
        ``kinesisanalytics.DeleteApplicationReferenceDataSource`` action.

        :param application_name: Name of an existing application.
        :param current_application_version_id: Version of the application.
        :param reference_id: ID of the reference data source.
        :returns: DeleteApplicationReferenceDataSourceResponse
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises InvalidArgumentException:
        :raises ConcurrentModificationException:
        :raises UnsupportedOperationException:
        """
        raise NotImplementedError

    @handler("DescribeApplication")
    def describe_application(
        self, context: RequestContext, application_name: ApplicationName
    ) -> DescribeApplicationResponse:
        """This documentation is for version 1 of the Amazon Kinesis Data Analytics
        API, which only supports SQL applications. Version 2 of the API supports
        SQL and Java applications. For more information about version 2, see
        `Amazon Kinesis Data Analytics API V2
        Documentation </kinesisanalytics/latest/apiv2/Welcome.html>`__.

        Returns information about a specific Amazon Kinesis Analytics
        application.

        If you want to retrieve a list of all applications in your account, use
        the
        `ListApplications <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/API_ListApplications.html>`__
        operation.

        This operation requires permissions to perform the
        ``kinesisanalytics:DescribeApplication`` action. You can use
        ``DescribeApplication`` to get the current application versionId, which
        you need to call other operations such as ``Update``.

        :param application_name: Name of the application.
        :returns: DescribeApplicationResponse
        :raises ResourceNotFoundException:
        :raises UnsupportedOperationException:
        """
        raise NotImplementedError

    @handler("DiscoverInputSchema")
    def discover_input_schema(
        self,
        context: RequestContext,
        resource_arn: ResourceARN = None,
        role_arn: RoleARN = None,
        input_starting_position_configuration: InputStartingPositionConfiguration = None,
        s3_configuration: S3Configuration = None,
        input_processing_configuration: InputProcessingConfiguration = None,
    ) -> DiscoverInputSchemaResponse:
        """This documentation is for version 1 of the Amazon Kinesis Data Analytics
        API, which only supports SQL applications. Version 2 of the API supports
        SQL and Java applications. For more information about version 2, see
        `Amazon Kinesis Data Analytics API V2
        Documentation </kinesisanalytics/latest/apiv2/Welcome.html>`__.

        Infers a schema by evaluating sample records on the specified streaming
        source (Amazon Kinesis stream or Amazon Kinesis Firehose delivery
        stream) or S3 object. In the response, the operation returns the
        inferred schema and also the sample records that the operation used to
        infer the schema.

        You can use the inferred schema when configuring a streaming source for
        your application. For conceptual information, see `Configuring
        Application
        Input <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/how-it-works-input.html>`__.
        Note that when you create an application using the Amazon Kinesis
        Analytics console, the console uses this operation to infer a schema and
        show it in the console user interface.

        This operation requires permissions to perform the
        ``kinesisanalytics:DiscoverInputSchema`` action.

        :param resource_arn: Amazon Resource Name (ARN) of the streaming source.
        :param role_arn: ARN of the IAM role that Amazon Kinesis Analytics can assume to access
        the stream on your behalf.
        :param input_starting_position_configuration: Point at which you want Amazon Kinesis Analytics to start reading
        records from the specified streaming source discovery purposes.
        :param s3_configuration: Specify this parameter to discover a schema from data in an Amazon S3
        object.
        :param input_processing_configuration: The
        `InputProcessingConfiguration <https://docs.
        :returns: DiscoverInputSchemaResponse
        :raises InvalidArgumentException:
        :raises UnableToDetectSchemaException:
        :raises ResourceProvisionedThroughputExceededException:
        :raises ServiceUnavailableException:
        """
        raise NotImplementedError

    @handler("ListApplications")
    def list_applications(
        self,
        context: RequestContext,
        limit: ListApplicationsInputLimit = None,
        exclusive_start_application_name: ApplicationName = None,
    ) -> ListApplicationsResponse:
        """This documentation is for version 1 of the Amazon Kinesis Data Analytics
        API, which only supports SQL applications. Version 2 of the API supports
        SQL and Java applications. For more information about version 2, see
        `Amazon Kinesis Data Analytics API V2
        Documentation </kinesisanalytics/latest/apiv2/Welcome.html>`__.

        Returns a list of Amazon Kinesis Analytics applications in your account.
        For each application, the response includes the application name, Amazon
        Resource Name (ARN), and status. If the response returns the
        ``HasMoreApplications`` value as true, you can send another request by
        adding the ``ExclusiveStartApplicationName`` in the request body, and
        set the value of this to the last application name from the previous
        response.

        If you want detailed information about a specific application, use
        `DescribeApplication <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/API_DescribeApplication.html>`__.

        This operation requires permissions to perform the
        ``kinesisanalytics:ListApplications`` action.

        :param limit: Maximum number of applications to list.
        :param exclusive_start_application_name: Name of the application to start the list with.
        :returns: ListApplicationsResponse
        """
        raise NotImplementedError

    @handler("ListTagsForResource")
    def list_tags_for_resource(
        self, context: RequestContext, resource_arn: KinesisAnalyticsARN
    ) -> ListTagsForResourceResponse:
        """Retrieves the list of key-value tags assigned to the application. For
        more information, see `Using
        Tagging <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/how-tagging.html>`__.

        :param resource_arn: The ARN of the application for which to retrieve tags.
        :returns: ListTagsForResourceResponse
        :raises ResourceNotFoundException:
        :raises InvalidArgumentException:
        :raises ConcurrentModificationException:
        """
        raise NotImplementedError

    @handler("StartApplication")
    def start_application(
        self,
        context: RequestContext,
        application_name: ApplicationName,
        input_configurations: InputConfigurations,
    ) -> StartApplicationResponse:
        """This documentation is for version 1 of the Amazon Kinesis Data Analytics
        API, which only supports SQL applications. Version 2 of the API supports
        SQL and Java applications. For more information about version 2, see
        `Amazon Kinesis Data Analytics API V2
        Documentation </kinesisanalytics/latest/apiv2/Welcome.html>`__.

        Starts the specified Amazon Kinesis Analytics application. After
        creating an application, you must exclusively call this operation to
        start your application.

        After the application starts, it begins consuming the input data,
        processes it, and writes the output to the configured destination.

        The application status must be ``READY`` for you to start an
        application. You can get the application status in the console or using
        the
        `DescribeApplication <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/API_DescribeApplication.html>`__
        operation.

        After you start the application, you can stop the application from
        processing the input by calling the
        `StopApplication <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/API_StopApplication.html>`__
        operation.

        This operation requires permissions to perform the
        ``kinesisanalytics:StartApplication`` action.

        :param application_name: Name of the application.
        :param input_configurations: Identifies the specific input, by ID, that the application starts
        consuming.
        :returns: StartApplicationResponse
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises InvalidArgumentException:
        :raises InvalidApplicationConfigurationException:
        :raises UnsupportedOperationException:
        """
        raise NotImplementedError

    @handler("StopApplication")
    def stop_application(
        self, context: RequestContext, application_name: ApplicationName
    ) -> StopApplicationResponse:
        """This documentation is for version 1 of the Amazon Kinesis Data Analytics
        API, which only supports SQL applications. Version 2 of the API supports
        SQL and Java applications. For more information about version 2, see
        `Amazon Kinesis Data Analytics API V2
        Documentation </kinesisanalytics/latest/apiv2/Welcome.html>`__.

        Stops the application from processing input data. You can stop an
        application only if it is in the running state. You can use the
        `DescribeApplication <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/API_DescribeApplication.html>`__
        operation to find the application state. After the application is
        stopped, Amazon Kinesis Analytics stops reading data from the input, the
        application stops processing data, and there is no output written to the
        destination.

        This operation requires permissions to perform the
        ``kinesisanalytics:StopApplication`` action.

        :param application_name: Name of the running application to stop.
        :returns: StopApplicationResponse
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises UnsupportedOperationException:
        """
        raise NotImplementedError

    @handler("TagResource")
    def tag_resource(
        self, context: RequestContext, resource_arn: KinesisAnalyticsARN, tags: Tags
    ) -> TagResourceResponse:
        """Adds one or more key-value tags to a Kinesis Analytics application. Note
        that the maximum number of application tags includes system tags. The
        maximum number of user-defined application tags is 50. For more
        information, see `Using
        Tagging <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/how-tagging.html>`__.

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
        """Removes one or more tags from a Kinesis Analytics application. For more
        information, see `Using
        Tagging <https://docs.aws.amazon.com/kinesisanalytics/latest/dev/how-tagging.html>`__.

        :param resource_arn: The ARN of the Kinesis Analytics application from which to remove the
        tags.
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
        current_application_version_id: ApplicationVersionId,
        application_update: ApplicationUpdate,
    ) -> UpdateApplicationResponse:
        """This documentation is for version 1 of the Amazon Kinesis Data Analytics
        API, which only supports SQL applications. Version 2 of the API supports
        SQL and Java applications. For more information about version 2, see
        `Amazon Kinesis Data Analytics API V2
        Documentation </kinesisanalytics/latest/apiv2/Welcome.html>`__.

        Updates an existing Amazon Kinesis Analytics application. Using this
        API, you can update application code, input configuration, and output
        configuration.

        Note that Amazon Kinesis Analytics updates the
        ``CurrentApplicationVersionId`` each time you update your application.

        This operation requires permission for the
        ``kinesisanalytics:UpdateApplication`` action.

        :param application_name: Name of the Amazon Kinesis Analytics application to update.
        :param current_application_version_id: The current application version ID.
        :param application_update: Describes application updates.
        :returns: UpdateApplicationResponse
        :raises CodeValidationException:
        :raises ResourceNotFoundException:
        :raises ResourceInUseException:
        :raises InvalidArgumentException:
        :raises ConcurrentModificationException:
        :raises UnsupportedOperationException:
        """
        raise NotImplementedError
