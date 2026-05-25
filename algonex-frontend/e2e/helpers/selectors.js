/**
 * Shared selectors for Ant Design components used across E2E tests.
 */

// Feedback components
export const antMessage = ".ant-message";
export const antMessageSuccess = ".ant-message .ant-message-success";
export const antMessageError = ".ant-message .ant-message-error";
export const antMessageWarning = ".ant-message .ant-message-warning";

// Loading
export const antSpin = ".ant-spin";
export const antSpinning = ".ant-spin-spinning";

// Modals & drawers
export const antModal = ".ant-modal";
export const antModalContent = ".ant-modal-content";
export const antDrawer = ".ant-drawer";
export const antDrawerContent = ".ant-drawer-content";

// Data display
export const antEmpty = ".ant-empty";
export const antTag = ".ant-tag";
export const antSteps = ".ant-steps";
export const antResult = ".ant-result";
export const antCollapse = ".ant-collapse";
export const antCollapseItem = ".ant-collapse-item";
export const antCarousel = ".ant-carousel";

// Form components
export const antUpload = ".ant-upload";
export const antSegmented = ".ant-segmented";
export const antRate = ".ant-rate";

// Navigation
export const antDropdown = ".ant-dropdown";
export const antDropdownMenu = ".ant-dropdown-menu";

// Tags by color
export function antTagColor(color) {
  return `.ant-tag-${color}`;
}

// Navbar-specific selectors
export const navbarSignIn = 'button:has-text("Sign In")';
export const navbarSignUp = 'button:has-text("Sign Up")';
export const navbarAvatarDropdown = ".ant-dropdown-trigger";
export const hamburgerMenu = ".ant-btn-icon-only";

// Progress
export const antProgress = ".ant-progress";
