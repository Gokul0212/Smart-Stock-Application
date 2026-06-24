@echo off
title Smart Stock Management System - Dev Server
echo ==========================================================
echo           SMART STOCK MANAGEMENT SYSTEM
echo ==========================================================
echo.
echo [1/2] Checking and installing dependencies...
call npm.cmd install
echo.
echo [2/2] Launching SvelteKit local development server...
echo.
call npm.cmd run dev
echo.

