from typing import IO, Iterable, List, Optional, TypedDict, Union

from localstack.aws.api import RequestContext, ServiceException, ServiceRequest, handler

ContentType = str
CorrelationData = str
MaxResults = int
NextToken = str
PageSize = int
Qos = int
ResponseTopic = str
Retain = bool
ShadowName = str
ThingName = str
Topic = str
UserProperties = str
errorMessage = str


class PayloadFormatIndicator(str):
    UNSPECIFIED_BYTES = "UNSPECIFIED_BYTES"
    UTF8_DATA = "UTF8_DATA"


class ConflictException(ServiceException):
    """The specified version does not match the version of the document."""

    code: str = "ConflictException"
    sender_fault: bool = False
    status_code: int = 409


class InternalFailureException(ServiceException):
    """An unexpected error has occurred."""

    code: str = "InternalFailureException"
    sender_fault: bool = False
    status_code: int = 500


class InvalidRequestException(ServiceException):
    """The request is not valid."""

    code: str = "InvalidRequestException"
    sender_fault: bool = False
    status_code: int = 400


class MethodNotAllowedException(ServiceException):
    """The specified combination of HTTP verb and URI is not supported."""

    code: str = "MethodNotAllowedException"
    sender_fault: bool = False
    status_code: int = 405


class RequestEntityTooLargeException(ServiceException):
    """The payload exceeds the maximum size allowed."""

    code: str = "RequestEntityTooLargeException"
    sender_fault: bool = False
    status_code: int = 413


class ResourceNotFoundException(ServiceException):
    """The specified resource does not exist."""

    code: str = "ResourceNotFoundException"
    sender_fault: bool = False
    status_code: int = 404


class ServiceUnavailableException(ServiceException):
    """The service is temporarily unavailable."""

    code: str = "ServiceUnavailableException"
    sender_fault: bool = False
    status_code: int = 503


class ThrottlingException(ServiceException):
    """The rate exceeds the limit."""

    code: str = "ThrottlingException"
    sender_fault: bool = False
    status_code: int = 429


class UnauthorizedException(ServiceException):
    """You are not authorized to perform this operation."""

    code: str = "UnauthorizedException"
    sender_fault: bool = False
    status_code: int = 401


class UnsupportedDocumentEncodingException(ServiceException):
    """The document encoding is not supported."""

    code: str = "UnsupportedDocumentEncodingException"
    sender_fault: bool = False
    status_code: int = 415


class DeleteThingShadowRequest(ServiceRequest):
    """The input for the DeleteThingShadow operation."""

    thingName: ThingName
    shadowName: Optional[ShadowName]


JsonDocument = bytes


class DeleteThingShadowResponse(TypedDict, total=False):
    """The output from the DeleteThingShadow operation."""

    payload: Union[JsonDocument, IO[JsonDocument], Iterable[JsonDocument]]


class GetRetainedMessageRequest(ServiceRequest):
    """The input for the GetRetainedMessage operation."""

    topic: Topic


UserPropertiesBlob = bytes
Timestamp = int
Payload = bytes


class GetRetainedMessageResponse(TypedDict, total=False):
    """The output from the GetRetainedMessage operation."""

    topic: Optional[Topic]
    payload: Optional[Payload]
    qos: Optional[Qos]
    lastModifiedTime: Optional[Timestamp]
    userProperties: Optional[UserPropertiesBlob]


class GetThingShadowRequest(ServiceRequest):
    """The input for the GetThingShadow operation."""

    thingName: ThingName
    shadowName: Optional[ShadowName]


class GetThingShadowResponse(TypedDict, total=False):
    """The output from the GetThingShadow operation."""

    payload: Optional[Union[JsonDocument, IO[JsonDocument], Iterable[JsonDocument]]]


class ListNamedShadowsForThingRequest(ServiceRequest):
    thingName: ThingName
    nextToken: Optional[NextToken]
    pageSize: Optional[PageSize]


NamedShadowList = List[ShadowName]


class ListNamedShadowsForThingResponse(TypedDict, total=False):
    results: Optional[NamedShadowList]
    nextToken: Optional[NextToken]
    timestamp: Optional[Timestamp]


class ListRetainedMessagesRequest(ServiceRequest):
    nextToken: Optional[NextToken]
    maxResults: Optional[MaxResults]


PayloadSize = int


class RetainedMessageSummary(TypedDict, total=False):
    """Information about a single retained message."""

    topic: Optional[Topic]
    payloadSize: Optional[PayloadSize]
    qos: Optional[Qos]
    lastModifiedTime: Optional[Timestamp]


RetainedMessageList = List[RetainedMessageSummary]


class ListRetainedMessagesResponse(TypedDict, total=False):
    retainedTopics: Optional[RetainedMessageList]
    nextToken: Optional[NextToken]


MessageExpiry = int


class PublishRequest(ServiceRequest):
    """The input for the Publish operation."""

    payload: Optional[IO[Payload]]
    topic: Topic
    qos: Optional[Qos]
    retain: Optional[Retain]
    userProperties: Optional[UserProperties]
    payloadFormatIndicator: Optional[PayloadFormatIndicator]
    contentType: Optional[ContentType]
    responseTopic: Optional[ResponseTopic]
    correlationData: Optional[CorrelationData]
    messageExpiry: Optional[MessageExpiry]


class UpdateThingShadowRequest(ServiceRequest):
    """The input for the UpdateThingShadow operation."""

    payload: IO[JsonDocument]
    thingName: ThingName
    shadowName: Optional[ShadowName]


class UpdateThingShadowResponse(TypedDict, total=False):
    """The output from the UpdateThingShadow operation."""

    payload: Optional[Union[JsonDocument, IO[JsonDocument], Iterable[JsonDocument]]]


class IotDataApi:
    service = "iot-data"
    version = "2015-05-28"

    @handler("DeleteThingShadow")
    def delete_thing_shadow(
        self, context: RequestContext, thing_name: ThingName, shadow_name: ShadowName = None
    ) -> DeleteThingShadowResponse:
        """Deletes the shadow for the specified thing.

        Requires permission to access the
        `DeleteThingShadow <https://docs.aws.amazon.com/service-authorization/latest/reference/list_awsiot.html#awsiot-actions-as-permissions>`__
        action.

        For more information, see
        `DeleteThingShadow <http://docs.aws.amazon.com/iot/latest/developerguide/API_DeleteThingShadow.html>`__
        in the IoT Developer Guide.

        :param thing_name: The name of the thing.
        :param shadow_name: The name of the shadow.
        :returns: DeleteThingShadowResponse
        :raises ResourceNotFoundException:
        :raises InvalidRequestException:
        :raises ThrottlingException:
        :raises UnauthorizedException:
        :raises ServiceUnavailableException:
        :raises InternalFailureException:
        :raises MethodNotAllowedException:
        :raises UnsupportedDocumentEncodingException:
        """
        raise NotImplementedError

    @handler("GetRetainedMessage")
    def get_retained_message(
        self, context: RequestContext, topic: Topic
    ) -> GetRetainedMessageResponse:
        """Gets the details of a single retained message for the specified topic.

        This action returns the message payload of the retained message, which
        can incur messaging costs. To list only the topic names of the retained
        messages, call
        `ListRetainedMessages <https://docs.aws.amazon.com/iot/latest/apireference/API_iotdata_ListRetainedMessages.html>`__.

        Requires permission to access the
        `GetRetainedMessage <https://docs.aws.amazon.com/service-authorization/latest/reference/list_awsiotfleethubfordevicemanagement.html#awsiotfleethubfordevicemanagement-actions-as-permissions>`__
        action.

        For more information about messaging costs, see `Amazon Web Services IoT
        Core pricing -
        Messaging <http://aws.amazon.com/iot-core/pricing/#Messaging>`__.

        :param topic: The topic name of the retained message to retrieve.
        :returns: GetRetainedMessageResponse
        :raises InvalidRequestException:
        :raises ResourceNotFoundException:
        :raises ThrottlingException:
        :raises UnauthorizedException:
        :raises ServiceUnavailableException:
        :raises InternalFailureException:
        :raises MethodNotAllowedException:
        """
        raise NotImplementedError

    @handler("GetThingShadow")
    def get_thing_shadow(
        self, context: RequestContext, thing_name: ThingName, shadow_name: ShadowName = None
    ) -> GetThingShadowResponse:
        """Gets the shadow for the specified thing.

        Requires permission to access the
        `GetThingShadow <https://docs.aws.amazon.com/service-authorization/latest/reference/list_awsiot.html#awsiot-actions-as-permissions>`__
        action.

        For more information, see
        `GetThingShadow <http://docs.aws.amazon.com/iot/latest/developerguide/API_GetThingShadow.html>`__
        in the IoT Developer Guide.

        :param thing_name: The name of the thing.
        :param shadow_name: The name of the shadow.
        :returns: GetThingShadowResponse
        :raises InvalidRequestException:
        :raises ResourceNotFoundException:
        :raises ThrottlingException:
        :raises UnauthorizedException:
        :raises ServiceUnavailableException:
        :raises InternalFailureException:
        :raises MethodNotAllowedException:
        :raises UnsupportedDocumentEncodingException:
        """
        raise NotImplementedError

    @handler("ListNamedShadowsForThing")
    def list_named_shadows_for_thing(
        self,
        context: RequestContext,
        thing_name: ThingName,
        next_token: NextToken = None,
        page_size: PageSize = None,
    ) -> ListNamedShadowsForThingResponse:
        """Lists the shadows for the specified thing.

        Requires permission to access the
        `ListNamedShadowsForThing <https://docs.aws.amazon.com/service-authorization/latest/reference/list_awsiot.html#awsiot-actions-as-permissions>`__
        action.

        :param thing_name: The name of the thing.
        :param next_token: The token to retrieve the next set of results.
        :param page_size: The result page size.
        :returns: ListNamedShadowsForThingResponse
        :raises ResourceNotFoundException:
        :raises InvalidRequestException:
        :raises ThrottlingException:
        :raises UnauthorizedException:
        :raises ServiceUnavailableException:
        :raises InternalFailureException:
        :raises MethodNotAllowedException:
        """
        raise NotImplementedError

    @handler("ListRetainedMessages")
    def list_retained_messages(
        self, context: RequestContext, next_token: NextToken = None, max_results: MaxResults = None
    ) -> ListRetainedMessagesResponse:
        """Lists summary information about the retained messages stored for the
        account.

        This action returns only the topic names of the retained messages. It
        doesn't return any message payloads. Although this action doesn't return
        a message payload, it can still incur messaging costs.

        To get the message payload of a retained message, call
        `GetRetainedMessage <https://docs.aws.amazon.com/iot/latest/apireference/API_iotdata_GetRetainedMessage.html>`__
        with the topic name of the retained message.

        Requires permission to access the
        `ListRetainedMessages <https://docs.aws.amazon.com/service-authorization/latest/reference/list_awsiotfleethubfordevicemanagement.html#awsiotfleethubfordevicemanagement-actions-as-permissions>`__
        action.

        For more information about messaging costs, see `Amazon Web Services IoT
        Core pricing -
        Messaging <http://aws.amazon.com/iot-core/pricing/#Messaging>`__.

        :param next_token: To retrieve the next set of results, the ``nextToken`` value from a
        previous response; otherwise **null** to receive the first set of
        results.
        :param max_results: The maximum number of results to return at one time.
        :returns: ListRetainedMessagesResponse
        :raises InvalidRequestException:
        :raises ThrottlingException:
        :raises UnauthorizedException:
        :raises ServiceUnavailableException:
        :raises InternalFailureException:
        :raises MethodNotAllowedException:
        """
        raise NotImplementedError

    @handler("Publish")
    def publish(
        self,
        context: RequestContext,
        topic: Topic,
        qos: Qos = None,
        retain: Retain = None,
        payload: IO[Payload] = None,
        user_properties: UserProperties = None,
        payload_format_indicator: PayloadFormatIndicator = None,
        content_type: ContentType = None,
        response_topic: ResponseTopic = None,
        correlation_data: CorrelationData = None,
        message_expiry: MessageExpiry = None,
    ) -> None:
        """Publishes an MQTT message.

        Requires permission to access the
        `Publish <https://docs.aws.amazon.com/service-authorization/latest/reference/list_awsiot.html#awsiot-actions-as-permissions>`__
        action.

        For more information about MQTT messages, see `MQTT
        Protocol <http://docs.aws.amazon.com/iot/latest/developerguide/mqtt.html>`__
        in the IoT Developer Guide.

        For more information about messaging costs, see `Amazon Web Services IoT
        Core pricing -
        Messaging <http://aws.amazon.com/iot-core/pricing/#Messaging>`__.

        :param topic: The name of the MQTT topic.
        :param qos: The Quality of Service (QoS) level.
        :param retain: A Boolean value that determines whether to set the RETAIN flag when the
        message is published.
        :param payload: The message body.
        :param user_properties: A JSON string that contains an array of JSON objects.
        :param payload_format_indicator: An ``Enum`` string value that indicates whether the payload is formatted
        as UTF-8.
        :param content_type: A UTF-8 encoded string that describes the content of the publishing
        message.
        :param response_topic: A UTF-8 encoded string that's used as the topic name for a response
        message.
        :param correlation_data: The base64-encoded binary data used by the sender of the request message
        to identify which request the response message is for when it's
        received.
        :param message_expiry: A user-defined integer value that represents the message expiry interval
        in seconds.
        :raises InternalFailureException:
        :raises InvalidRequestException:
        :raises UnauthorizedException:
        :raises MethodNotAllowedException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("UpdateThingShadow")
    def update_thing_shadow(
        self,
        context: RequestContext,
        thing_name: ThingName,
        payload: IO[JsonDocument],
        shadow_name: ShadowName = None,
    ) -> UpdateThingShadowResponse:
        """Updates the shadow for the specified thing.

        Requires permission to access the
        `UpdateThingShadow <https://docs.aws.amazon.com/service-authorization/latest/reference/list_awsiot.html#awsiot-actions-as-permissions>`__
        action.

        For more information, see
        `UpdateThingShadow <http://docs.aws.amazon.com/iot/latest/developerguide/API_UpdateThingShadow.html>`__
        in the IoT Developer Guide.

        :param thing_name: The name of the thing.
        :param payload: The state information, in JSON format.
        :param shadow_name: The name of the shadow.
        :returns: UpdateThingShadowResponse
        :raises ConflictException:
        :raises RequestEntityTooLargeException:
        :raises InvalidRequestException:
        :raises ThrottlingException:
        :raises UnauthorizedException:
        :raises ServiceUnavailableException:
        :raises InternalFailureException:
        :raises MethodNotAllowedException:
        :raises UnsupportedDocumentEncodingException:
        """
        raise NotImplementedError
