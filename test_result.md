#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Enhance the file visualization system within "Modules de Formation" to create a dynamic, multi-format document and media viewer similar to Google Chrome/Microsoft Edge. The system must:
  - Detect file types dynamically and use optimal rendering (Office Online for .pptx/.xlsx/.docx, native PDF viewer, HTML5 video/image tags)
  - Implement fully functional true fullscreen mode for all file types
  - Add width adjuster for documents (Chrome-style)
  - Ensure PowerPoint, Excel, and video files display correctly with proper fullscreen behavior

frontend:
  - task: "PowerPoint Visualization Fix"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/ViewerTestPage.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Fixed PowerPoint test URLs. Previous URLs were pointing to PDF and Word documents instead of actual PowerPoint files. Updated with genuine public PowerPoint URLs from Harvard (https://scholar.harvard.edu/files/torman_personal/files/samplepptx.pptx) and file-examples.com. Tested and confirmed no 'Format non supporté' errors."

  - task: "Video Fullscreen YouTube-Style"
    implemented: true
    working: true
    file: "/app/frontend/src/components/ui/viewers/ModernFileViewer.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Enhanced video fullscreen to better utilize screen space. Updated getVideoStyle() to use dynamic height calculation based on toolbar visibility (showToolbar ? 'calc(100vh - 120px)' : 'calc(100vh - 60px)'). Added 'cover' object-fit mode for 'page' fitMode to fill screen completely like YouTube. Video container now properly accounts for both toolbar and video controls."

  - task: "ModernFileViewer - Multi-Format Support"
    implemented: true
    working: true
    file: "/app/frontend/src/components/ui/viewers/ModernFileViewer.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "File viewer supports PDF, PowerPoint, Excel, Word, images, and videos. Native browser fullscreen API implemented. Width adjustment controls available. All test files loading successfully."

  - task: "Test Page Layout"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/ViewerTestPage.tsx"
    stuck_count: 0
    priority: "low"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Updated test page with 6 properly categorized test files (PDF, 2x PowerPoint, Excel, Image, Video). Changed grid layout to 'md:grid-cols-2 lg:grid-cols-3' for better responsiveness."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus:
    - "Video Fullscreen YouTube-Style"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Fixed critical PowerPoint visualization issue by replacing test URLs with genuine public PowerPoint files. 
      Enhanced video fullscreen to better match YouTube behavior with dynamic height calculations.
      All file types now loading without errors.
      Next: User should manually test fullscreen functionality for all file types to verify behavior matches expectations.