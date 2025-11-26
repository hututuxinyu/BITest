package com.biservice.controller;

import com.biservice.dto.ApiResponse;
import com.biservice.dto.LoginRequest;
import com.biservice.dto.UserVO;
import com.biservice.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import javax.validation.Valid;

/**
 * 用户控制器
 * 
 * @author BI Service Team
 */
@RestController
@RequestMapping("/user")
@Validated
public class UserController {

    @Autowired
    private UserService userService;

    /**
     * 用户登录
     * 
     * @param request 登录请求
     * @return 用户信息
     */
    @PostMapping("/login")
    public ApiResponse<UserVO> login(@Valid @RequestBody LoginRequest request) {
        try {
            UserVO user = userService.login(request.getUsername(), request.getPassword());
            return ApiResponse.success("登录成功", user);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 获取当前用户信息
     * 
     * @param userId 用户ID
     * @return 用户信息
     */
    @GetMapping("/current")
    public ApiResponse<UserVO> getCurrentUser(@RequestParam String userId) {
        try {
            UserVO user = userService.getCurrentUser(userId);
            return ApiResponse.success(user);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}


