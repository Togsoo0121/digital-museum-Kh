import React from "react";
import "./Tabs.css";

function Tabs({ activeTab, setActiveTab }) {
  return (
    <nav className="tabs">
      <button
        className={activeTab === "introduction" ? "active" : ""}
        onClick={() => setActiveTab("introduction")}
      >
        Музейн танилцуулга
      </button>
      <button
        className={activeTab === "heritage" ? "active" : ""}
        onClick={() => setActiveTab("heritage")}
      >
        Соёлын өв
      </button>
      <button
        className={activeTab === "reports" ? "active" : ""}
        onClick={() => setActiveTab("reports")}
      >
        Ажлын тайлан
      </button>
      <button
        className={activeTab === "admin" ? "active" : ""}
        onClick={() => setActiveTab("admin")}
      >
        Удирдлага
      </button>
    </nav>
  );
}

export default Tabs;
