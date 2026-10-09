package Security;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAutenticatorFilter extends OncePerRequestFilter {
    private final JwtAutenticatorFilter jwtAutenticatorFilter;

}
