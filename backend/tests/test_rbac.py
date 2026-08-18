import pytest

def test_junior_dev_cannot_access_admin_endpoints(client, junior_token):
    """Test junior-dev cannot access `/admin/*` endpoints (403)"""
    pass

def test_senior_dev_cannot_access_admin_endpoints(client):
    """Test senior-dev cannot access `/admin/*` endpoints (403)"""
    pass

def test_admin_can_access_admin_endpoints(client, admin_token):
    """Test admin can access protected admin endpoints"""
    pass

def test_admin_can_upgrade_users(client, admin_token):
    """Test admin can upgrade users"""
    pass

def test_role_persistence_across_login_logout(client):
    """Test role persistence across login/logout"""
    pass
