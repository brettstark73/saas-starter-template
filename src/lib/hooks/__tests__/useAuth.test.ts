import { renderHook } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useAuth, usePermissions } from '../useAuth'

// Mock next-auth
jest.mock('next-auth/react')
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return loading state when session is loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBe(null)
  })

  it('should return unauthenticated state when no session', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBe(null)
    expect(result.current.role).toBe(null)
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isSuperAdmin).toBe(false)
  })

  it('should return user data when authenticated', () => {
    const mockSession = {
      user: {
        id: '1',
        email: 'user@example.com',
        name: 'John Doe',
        role: 'USER',
      },
    }

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toEqual({
      id: '1',
      email: 'user@example.com',
      name: 'John Doe',
      role: 'USER',
    })
    expect(result.current.role).toBe('USER')
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isSuperAdmin).toBe(false)
  })

  it('should correctly identify admin user', () => {
    const mockSession = {
      user: {
        id: '1',
        email: 'admin@example.com',
        role: 'ADMIN',
      },
    }

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.isAdmin).toBe(true)
    expect(result.current.isSuperAdmin).toBe(false)
    expect(result.current.canAccess('USER')).toBe(true)
    expect(result.current.canAccess('ADMIN')).toBe(true)
    expect(result.current.canAccess('SUPER_ADMIN')).toBe(false)
  })

  it('should correctly identify super admin user', () => {
    const mockSession = {
      user: {
        id: '1',
        email: 'superadmin@example.com',
        role: 'SUPER_ADMIN',
      },
    }

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.isAdmin).toBe(true)
    expect(result.current.isSuperAdmin).toBe(true)
    expect(result.current.canAccess('USER')).toBe(true)
    expect(result.current.canAccess('ADMIN')).toBe(true)
    expect(result.current.canAccess('SUPER_ADMIN')).toBe(true)
  })

  it('should handle role checks correctly', () => {
    const mockSession = {
      user: {
        id: '1',
        email: 'admin@example.com',
        role: 'ADMIN',
      },
    }

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.hasRole('ADMIN')).toBe(true)
    expect(result.current.hasRole('USER')).toBe(false)
    expect(result.current.hasRole('SUPER_ADMIN')).toBe(false)

    expect(result.current.hasAnyRole(['USER', 'ADMIN'])).toBe(true)
    expect(result.current.hasAnyRole(['USER', 'SUPER_ADMIN'])).toBe(false)

    expect(result.current.hasAllRoles(['ADMIN'])).toBe(true)
    expect(result.current.hasAllRoles(['ADMIN', 'SUPER_ADMIN'])).toBe(false)
  })

  it('should default to USER role when no role provided', () => {
    const mockSession = {
      user: {
        id: '1',
        email: 'user@example.com',
        // No role property
      },
    }

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.user?.role).toBe('USER')
    expect(result.current.role).toBeNull() // The hook returns null if no role in session
  })
})

describe('usePermissions', () => {
  it('should provide correct permission methods for admin user', () => {
    const mockSession = {
      user: {
        id: '1',
        email: 'admin@example.com',
        role: 'ADMIN',
      },
    }

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    const { result } = renderHook(() => usePermissions())

    expect(result.current.canViewAdminPanel()).toBe(true)
    expect(result.current.canManageUsers()).toBe(true)
    expect(result.current.canManageOrganizations()).toBe(true)
    expect(result.current.canAccessSuperAdmin()).toBe(false)
    expect(result.current.canDeleteUsers()).toBe(false)
    expect(result.current.canModifySystemSettings()).toBe(false)
  })

  it('should provide correct permission methods for super admin user', () => {
    const mockSession = {
      user: {
        id: '1',
        email: 'superadmin@example.com',
        role: 'SUPER_ADMIN',
      },
    }

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    const { result } = renderHook(() => usePermissions())

    expect(result.current.canViewAdminPanel()).toBe(true)
    expect(result.current.canManageUsers()).toBe(true)
    expect(result.current.canManageOrganizations()).toBe(true)
    expect(result.current.canAccessSuperAdmin()).toBe(true)
    expect(result.current.canDeleteUsers()).toBe(true)
    expect(result.current.canModifySystemSettings()).toBe(true)
  })

  it('should deny all admin permissions for regular user', () => {
    const mockSession = {
      user: {
        id: '1',
        email: 'user@example.com',
        role: 'USER',
      },
    }

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    const { result } = renderHook(() => usePermissions())

    expect(result.current.canViewAdminPanel()).toBe(false)
    expect(result.current.canManageUsers()).toBe(false)
    expect(result.current.canManageOrganizations()).toBe(false)
    expect(result.current.canAccessSuperAdmin()).toBe(false)
    expect(result.current.canDeleteUsers()).toBe(false)
    expect(result.current.canModifySystemSettings()).toBe(false)
  })
})
