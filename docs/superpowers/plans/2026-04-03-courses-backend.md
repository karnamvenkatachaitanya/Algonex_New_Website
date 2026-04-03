# Courses System Backend Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the courses Django app with models, services, selectors, serializers, views, and a seed command — following the 4-layer architecture established in the accounts app.

**Architecture:** 4-layer (API → Service → Selector → Model). Course has nested Modules → Topics. Enrollment links students to courses. Instructor ownership enforced via custom permission. Seed command imports existing 4 courses from frontend constant.js.

**Tech Stack:** Django 5.x, DRF, django-filter, pytest

**Spec:** `docs/superpowers/specs/2026-04-03-algonex-platform-redesign.md` (Sub-Project 2)

**Backend only** — frontend handled by separate agent.

---

## Tasks

### Task 1: Create courses app with models
### Task 2: Services and selectors  
### Task 3: Serializers
### Task 4: Permissions and exceptions
### Task 5: Views and URLs
### Task 6: Django admin configuration
### Task 7: Seed command
### Task 8: Integration tests
