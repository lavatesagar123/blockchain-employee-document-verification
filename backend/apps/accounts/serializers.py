"""Serializers for authentication endpoints."""

from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    """Validates login credentials accepting either `email` or `username`."""

    email = serializers.CharField(required=False, allow_blank=True)
    username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        identifier = (attrs.get('email') or attrs.get('username') or '').strip()
        if not identifier:
            raise serializers.ValidationError({'email': 'Email or User ID is required.'})
        attrs['identifier'] = identifier
        return attrs


class LogoutSerializer(serializers.Serializer):
    """Accepts optional refresh token to blacklist on logout."""

    refresh = serializers.CharField(required=False, allow_blank=True)
