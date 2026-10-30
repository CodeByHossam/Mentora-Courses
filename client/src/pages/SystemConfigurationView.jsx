import React from "react";

const SystemConfigurationView = (props) => {
  return (
    <div className="max-w-7xl mx-auto py-4 md:py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-4 md:p-6 text-white mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 flex items-center">
          <Settings className="mr-3 h-8 w-8" />
          System Configuration
        </h1>
        <p className="text-blue-100 text-sm md:text-base lg:text-lg">
          Configure system settings and preferences
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 md:px-6 py-3 md:py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600 bg-blue-50"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6 md:p-8">
          {renderTabContent()}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 md:px-8 py-4 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="mr-2 h-4 w-4" />
            Last saved: Never
          </div>
          <div className="flex space-x-3">
            <button
              onClick={loadConfiguration}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Reload
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {config.general.maintenanceMode && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Maintenance Mode Active
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                The system is currently in maintenance mode. Users cannot access the application.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  );
};

export default SystemConfigurationView;
