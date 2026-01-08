export function validateEmail(email: string): string | null {
  if (!email) {
    return 'البريد الإلكتروني مطلوب';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'البريد الإلكتروني غير صالح';
  }

  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) {
    return 'كلمة المرور مطلوبة';
  }

  if (password.length < 8) {
    return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
  }

  return null;
}

export function validateName(name: string): string | null {
  if (!name) {
    return 'الاسم مطلوب';
  }

  if (name.length < 3) {
    return 'الاسم يجب أن يكون 3 أحرف على الأقل';
  }

  return null;
}

export function validatePasswordMatch(password: string, confirmPassword: string): string | null {
  if (password !== confirmPassword) {
    return 'كلمة المرور غير متطابقة';
  }

  return null;
}
