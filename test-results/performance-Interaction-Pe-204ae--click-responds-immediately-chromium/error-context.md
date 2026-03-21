# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - navigation [ref=e3]:
      - link "CROW Logo CROW" [ref=e5] [cursor=pointer]:
        - /url: /
        - generic [ref=e6]:
          - img "CROW Logo" [ref=e7]
          - generic [ref=e8]: CROW
      - generic [ref=e10]:
        - text: Don't have an account?
        - link "Sign up" [ref=e11] [cursor=pointer]:
          - /url: /signup
    - main [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e14]:
          - generic [ref=e15]: Log In
          - heading "Welcome back." [level=1] [ref=e16]
          - paragraph [ref=e17]: Sign in to access your CROW dashboard.
        - generic [ref=e19]:
          - generic [ref=e20]:
            - textbox "Work email" [ref=e24]: test@example.com
            - textbox "Password" [ref=e28]: password123
          - link "Forgot password?" [ref=e30] [cursor=pointer]:
            - /url: /forgot-password
          - button "Signing in" [active] [ref=e32]:
            - text: Signing in
            - img [ref=e34]
        - generic [ref=e43]:
          - generic [ref=e47]: Or
          - button "Continue with Google" [ref=e50]:
            - generic [ref=e51]:
              - img [ref=e52]
              - text: Continue with Google
  - alert [ref=e58]
```