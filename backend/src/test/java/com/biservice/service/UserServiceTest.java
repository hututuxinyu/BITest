package com.biservice.service;

import com.biservice.dto.UserVO;
import com.biservice.entity.User;
import com.biservice.repository.UserRepository;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.time.LocalDateTime;
import java.util.Optional;
import static org.junit.Assert.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * 用户服务测试类
 * 
 * @author BI Service Team
 */
@RunWith(MockitoJUnitRunner.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private User testUser;

    @Before
    public void setUp() {
        testUser = new User();
        testUser.setUserId("user-001");
        testUser.setUsername("admin");
        testUser.setEmail("admin@example.com");
        testUser.setPasswordHash(new BCryptPasswordEncoder().encode("admin123"));
        testUser.setStatus("active");
        testUser.setCreateTime(LocalDateTime.now());
    }

    @Test
    public void testLogin_Success() {
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        UserVO result = userService.login("admin", "admin123");

        assertNotNull(result);
        assertEquals("user-001", result.getUserId());
        assertEquals("admin", result.getUsername());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test(expected = RuntimeException.class)
    public void testLogin_UserNotFound() {
        when(userRepository.findByUsername("admin")).thenReturn(Optional.empty());

        userService.login("admin", "admin123");
    }

    @Test(expected = RuntimeException.class)
    public void testLogin_WrongPassword() {
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(testUser));

        userService.login("admin", "wrongpassword");
    }

    @Test
    public void testGetCurrentUser_Success() {
        when(userRepository.findById("user-001")).thenReturn(Optional.of(testUser));

        UserVO result = userService.getCurrentUser("user-001");

        assertNotNull(result);
        assertEquals("user-001", result.getUserId());
        assertEquals("admin", result.getUsername());
    }

    @Test(expected = RuntimeException.class)
    public void testGetCurrentUser_NotFound() {
        when(userRepository.findById("user-001")).thenReturn(Optional.empty());

        userService.getCurrentUser("user-001");
    }
}





