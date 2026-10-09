package Security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class Autenticator implements UserDetailsService {

    private final PasswordEncoder passwordEncoder;

    public Autenticator(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }
    @Autowired
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        if (username.equals("admin")) {
            return User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("123456"))
                    .roles("ADMIN")
                    .build();
        }
        throw new UsernameNotFoundException("User not found with username: " + username);
    }
}