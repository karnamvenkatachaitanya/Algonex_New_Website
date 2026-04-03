from rest_framework.exceptions import APIException
from rest_framework import status


class AlreadyApplied(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "You have already applied to this job."
    default_code = "ALREADY_APPLIED"


class JobNotActive(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "This job listing is no longer active."
    default_code = "JOB_NOT_ACTIVE"


class InvalidTransition(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = "INVALID_TRANSITION"
