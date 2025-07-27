# EHB AI Agent API Documentation

## Overview

EHB AI Agent system provides intelligent agents for healthcare management.

## Agent Types

### Healthcare Agent

- **Purpose**: Patient management and medical records

- **Capabilities**:

  - Patient data processing

  - Medical record management

  - Appointment scheduling

  - Health analytics

  - Medical advice generation

### Data Agent

- **Purpose**: Data processing and analytics

- **Capabilities**:

  - Data analysis

  - Data cleaning

  - Data visualization

  - Report generation

  - Predictive analytics

### Development Agent

- **Purpose**: Code development and maintenance

- **Capabilities**:

  - Code generation

  - Bug fixing

  - Testing

  - Deployment

  - Documentation

## API Endpoints

### Agent Management

- `POST /api/agents` - Create new agent

- `GET /api/agents` - List all agents

- `GET /api/agents/{agent_id}` - Get agent details

- `PUT /api/agents/{agent_id}` - Update agent

- `DELETE /api/agents/{agent_id}` - Delete agent

### Agent Communication

- `POST /api/agents/{agent_id}/process` - Process input

- `POST /api/agents/{agent_id}/learn` - Learn from experience

- `POST /api/agents/{agent_id}/plan` - Create plan

- `POST /api/agents/{agent_id}/execute` - Execute action

### Agent Memory

- `GET /api/agents/{agent_id}/memory` - Get agent memory

- `POST /api/agents/{agent_id}/memory` - Store memory

- `DELETE /api/agents/{agent_id}/memory` - Clear memory

## Configuration

All agent configurations are stored in `ai_configs/agents/agent_config.json`

## Testing

Run tests with: `pytest ai_tests/`
