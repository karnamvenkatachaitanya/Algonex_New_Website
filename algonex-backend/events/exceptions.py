from rest_framework.exceptions import APIException
from rest_framework import status


class EventNotOpen(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "This event is not open for registration."
    default_code = "EVENT_NOT_OPEN"


class AlreadyRegistered(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "You are already registered for this event."
    default_code = "ALREADY_REGISTERED"
