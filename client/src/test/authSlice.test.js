import authReducer, {
  setCredentials,
  sendLogout,
  selectCurrentToken,
} from '../store/slices/authSlice';

describe('authSlice', () => {
  it('stores credentials', () => {
    const state = authReducer(undefined, setCredentials({ accessToken: 'token123', user: { name: 'Test' } }));
    expect(state.accessToken).toBe('token123');
    expect(state.user.name).toBe('Test');
    expect(selectCurrentToken({ auth: state })).toBe('token123');
  });

  it('clears on logout', () => {
    const state = authReducer({ user: { name: 'Test' }, accessToken: 'token', isRefreshing: false }, sendLogout());
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
  });
});