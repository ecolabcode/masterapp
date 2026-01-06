import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Auth,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updatePassword,
  updateProfile,
} from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { ToastStore } from '../core/toast/toast.store';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private auth = inject(Auth);
  private db = inject(Firestore);
  private toast = inject(ToastStore);

  user = signal<User | null>(null);
  profile = signal<UserProfile | null>(null);

  isLoggedIn = computed(() => !!this.user());

  constructor() {
    onAuthStateChanged(this.auth, async (u) => {
      this.user.set(u);

      if (!u) {
        this.profile.set(null);
        return;
      }

      const ref = doc(this.db, 'users', u.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        this.profile.set(snap.data() as UserProfile);
      } else {
        const p: UserProfile = {
          uid: u.uid,
          name: u.displayName || 'New user',
          email: u.email || '',
          description: '',
        };
        await setDoc(ref, p, { merge: true });
        this.profile.set(p);
      }
    });
  }

  async signup(name: string, email: string, password: string) {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    await updateProfile(cred.user, { displayName: name });

    const profile: UserProfile = { uid: cred.user.uid, name, email, description: '' };
    await setDoc(doc(this.db, 'users', cred.user.uid), profile, { merge: true });

    this.toast.success('Account created.');
    this.toast.info('Logged in.');
  }

  async login(email: string, password: string) {
    await signInWithEmailAndPassword(this.auth, email, password);
    this.toast.success('Login successful.');
    this.toast.info('Logged in.');
  }

  async logout() {
    await signOut(this.auth);
    this.toast.info('Logged out.');
  }

  async updateAccount(data: { name: string; email: string; description: string }) {
    const u = this.user();
    if (!u) return;

    await updateProfile(u, { displayName: data.name });

    if (data.email !== u.email) {
      await updateEmail(u, data.email);
    }

    const profile: UserProfile = {
      uid: u.uid,
      name: data.name,
      email: data.email,
      description: data.description,
    };

    await setDoc(doc(this.db, 'users', u.uid), profile, { merge: true });
    this.profile.set(profile);

    this.toast.success('Account updated.');
  }

  async changePassword(newPassword: string) {
    const u = this.user();
    if (!u) return;
    await updatePassword(u, newPassword);
    this.toast.success('Password updated.');
  }
}
