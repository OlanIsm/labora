"use client";
import { Component } from "react";
import type { ReactNode } from "react";
export default class LabErrorBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <section className="empty-state">
        <h2>Meja belum bisa ditampilkan</h2>
        <p>
          Konfigurasi tersimpan tidak dihapus. Muat ulang untuk mencoba lagi.
        </p>
        <button
          className="button primary"
          onClick={() => window.location.reload()}
        >
          Muat ulang
        </button>
      </section>
    ) : (
      this.props.children
    );
  }
}
