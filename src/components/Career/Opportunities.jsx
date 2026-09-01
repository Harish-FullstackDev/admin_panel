import React, { useState } from "react";
import {
  BiSearch,
  BiFilter,
  BiChevronLeft,
  BiChevronRight,
} from "react-icons/bi";
import { HiCube } from "react-icons/hi2";
import { allJobs, tabs } from "../Constants/Careers/jobData";
import { useRouter } from 'next/navigation';

const JobBoard = () => {

  const router = useRouter();
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 5;

  const [skillFilters, setSkillFilters] = useState([
    { id: "sales", label: "Sales", count: 15, checked: false },
    { id: "sap", label: "SAP", count: 12, checked: false },
    {
      id: "digital-marketing",
      label: "Digital Marketing",
      count: 18,
      checked: false,
    },
    { id: "uiux", label: "UI/UX", count: 22, checked: false },
    {
      id: "web-dev",
      label: "Product & Web Development",
      count: 28,
      checked: false,
    },
  ]);

  const [typeFilters, setTypeFilters] = useState([
    { id: "full-time", label: "Full-time", count: 45, checked: false },
    { id: "part-time", label: "Part-time", count: 12, checked: false },
    { id: "freelancer", label: "Freelancer", count: 18, checked: false },
    { id: "internship", label: "Internship", count: 8, checked: false },
  ]);

  const getFilteredJobs = () => {
    let filteredJobs = allJobs;

    // Filter by active tab
    if (activeTab !== "ALL") {
      filteredJobs = filteredJobs.filter((job) => job.category === activeTab);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filteredJobs = filteredJobs.filter(
        (job) =>
          job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.company.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Combine skill and type filters
    const selectedSkillIds = skillFilters
      .filter((filter) => filter.checked)
      .map((filter) => filter.id);
    const selectedTypeLabels = typeFilters
      .filter((filter) => filter.checked)
      .map((filter) => filter.label);

    // If no filters are selected, show all jobs based on active tab and search
    if (selectedSkillIds.length === 0 && selectedTypeLabels.length === 0) {
      return filteredJobs;
    }

    // Apply combined filters
    return filteredJobs.filter((job) => {
      const jobMatchesSkill =
        selectedSkillIds.length === 0 ||
        selectedSkillIds.some((skillId) => {
          const categoryMap = {
            sales: "SALES",
            sap: "SAP",
            "digital-marketing": "DIGITAL MARKETING",
            uiux: "UIUX",
            "web-dev": "PRODUCT & WEB DEVELOPMENT",
          };
          return job.category === categoryMap[skillId];
        });

      const jobMatchesType =
        selectedTypeLabels.length === 0 ||
        selectedTypeLabels.includes(job.type);

      return jobMatchesSkill && jobMatchesType;
    });
  };

  const allFilteredJobs = getFilteredJobs();
  const totalPages = Math.ceil(allFilteredJobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const endIndex = startIndex + jobsPerPage;
  const currentJobs = allFilteredJobs.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = (filterType, id) => {
    setCurrentPage(1);
    if (filterType === "skill") {
      handleSkillFilterChange(id);
    } else if (filterType === "type") {
      handleTypeFilterChange(id);
    }
  };

  // Reset to page 1 when tab or search changes
  const handleTabChange = (tab) => {
    setCurrentPage(1);
    setActiveTab(tab);
  };

  const handleSearchChange = (query) => {
    setCurrentPage(1);
    setSearchQuery(query);
  };

  const handleSkillFilterChange = (id) => {
    setSkillFilters((prev) =>
      prev.map((filter) =>
        filter.id === id ? { ...filter, checked: !filter.checked } : filter
      )
    );
  };

  const handleTypeFilterChange = (id) => {
    setTypeFilters((prev) =>
      prev.map((filter) =>
        filter.id === id ? { ...filter, checked: !filter.checked } : filter
      )
    );
  };

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleJobCardClick = () => {
  router.push(`http://54.245.101.243/candidate/login`);
  };

  return (
    <div className="min-h-screen bg-[rgba(167,202,255,0.13)] overflow-x-hidden overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between max-w-7xl mx-auto gap-4 ">
          <div className="flex items-center w-full lg:w-auto space-x-2">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Find a Job"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-4 pr-12 py-2 w-full border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-400 p-2 rounded-full hover:bg-blue-500 transition-colors">
                <BiSearch className="h-4 w-4 text-white" />
              </button>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-full bg-blue-400 text-white hover:bg-blue-500 transition-colors"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-filters-menu"
            >
              <BiFilter className="h-6 w-6" />
            </button>
          </div>
          {/* Tabs - Scrollable on mobile */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 lg:pb-0 cursor-pointer">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer ${
                  activeTab === tab
                    ? "bg-blue-400 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search and Mobile Filter Button */}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-2 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Sidebar Filters - Conditionally visible */}
          <div
            className={`w-full lg:w-80 lg:flex-shrink-0 lg:block ${
              isMobileMenuOpen ? "block" : "hidden"
            }`}
            id="mobile-filters-menu"
          >
            <div className="bg-white rounded-2xl p-4 sm:p-9 shadow-sm">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
                Filter
              </h2>

              {/* Skill Filters */}
              <div className="mb-6 sm:mb-8">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
                  Skills you want
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {skillFilters.map((filter) => (
                    <label
                      key={filter.id}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filter.checked}
                          onChange={() =>
                            handleFilterChange("skill", filter.id)
                          }
                          className="hidden"
                        />
                        <div
                          className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md border-2 mr-2 sm:mr-3 flex items-center justify-center transition-all ${
                            filter.checked
                              ? "bg-blue-400 border-blue-400"
                              : "border-gray-300"
                          }`}
                        >
                          {filter.checked && (
                            <svg
                              className="w-2 h-2 sm:w-3 sm:h-3 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm sm:text-base text-gray-700">
                          {filter.label}
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm text-gray-400">
                        ({filter.count})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Type Jobs Filters */}
              <div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
                  Job Type
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {typeFilters.map((filter) => (
                    <label
                      key={filter.id}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filter.checked}
                          onChange={() => handleFilterChange("type", filter.id)}
                          className="hidden"
                        />
                        <div
                          className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md border-2 mr-2 sm:mr-3 flex items-center justify-center transition-all ${
                            filter.checked
                              ? "bg-blue-400 border-blue-400"
                              : "border-gray-300"
                          }`}
                        >
                          {filter.checked && (
                            <svg
                              className="w-2 h-2 sm:w-3 sm:h-3 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm sm:text-base text-gray-700">
                          {filter.label}
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm text-gray-400">
                        ({filter.count})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Job Listings */}
          <div className="flex-1">
            {currentJobs.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <p className="text-gray-500 text-lg">
                  No jobs found matching your criteria.
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Try adjusting your filters or search terms.
                </p>
              </div>
            ) : (
              <>
                {/* Jobs Results Info */}

                {/* Job Cards */}
                <div className="space-y-3 sm:space-y-4 mb-6">
                  {currentJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={handleJobCardClick}
                      className={`p-4 sm:p-6 rounded-2xl transition-all duration-200 cursor-pointer hover:shadow-md ${
                        job.highlighted
                          ? "bg-blue-400 text-white"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center">
                          <div
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0 ${
                              job.highlighted ? "bg-white/20" : "bg-blue-100"
                            }`}
                          >
                            <HiCube
                              className={`h-5 w-5 sm:h-6 sm:w-6 ${
                                job.highlighted
                                  ? "text-blue-600"
                                  : "text-blue-400"
                              }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <h3
                              className={`text-base sm:text-lg font-semibold truncate ${
                                job.highlighted ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {job.title}
                            </h3>
                            <p
                              className={`text-sm ${
                                job.highlighted
                                  ? "text-white/80"
                                  : "text-gray-600"
                              }`}
                            >
                              {job.company}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end sm:space-x-6 lg:space-x-8 w-full sm:w-auto">
                          {/* Job Type Information */}
                          <div className="text-left sm:text-center">
                            <p
                              className={`text-sm font-medium ${
                                job.highlighted ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {job.type}
                            </p>
                            <p
                              className={`text-xs ${
                                job.highlighted
                                  ? "text-white/80"
                                  : "text-gray-600"
                              }`}
                            >
                              Type
                            </p>
                          </div>

                          {/* Salary Information */}
                          <div className="text-right">
                            <p
                              className={`text-sm font-semibold ${
                                job.highlighted ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {job.salary}
                            </p>
                            <p
                              className={`text-xs ${
                                job.highlighted
                                  ? "text-white/80"
                                  : "text-gray-600"
                              }`}
                            >
                              Salary
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className=" rounded-2xl p-4 sm:p-6 ">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      {/* Page Info */}
                      <div className="mb-4 text-sm text-gray-600">
                        Showing {startIndex + 1}-
                        {Math.min(endIndex, allFilteredJobs.length)} of{" "}
                        {allFilteredJobs.length} jobs
                      </div>

                      {/* Pagination Controls */}
                      <div className="flex items-center space-x-2">
                        <div className="text-sm text-gray-600">
                          Page {currentPage} of {totalPages}
                        </div>
                        {/* Previous Button */}
                        <button
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1}
                          className={`p-2 rounded-lg transition-colors ${
                            currentPage === 1
                              ? "text-gray-400 cursor-not-allowed"
                              : "text-blue-400 hover:bg-blue-50"
                          }`}
                        >
                          <BiChevronLeft className="h-5 w-5" />
                        </button>

                        <div className="flex items-center space-x-1">
                          {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1
                          ).map((page) => {
                            const shouldShow =
                              page === 1 ||
                              page === totalPages ||
                              Math.abs(page - currentPage) <= 1;

                            if (!shouldShow) {
                              if (page === 2 && currentPage > 4) {
                                return (
                                  <span
                                    key={page}
                                    className="px-2 text-gray-400"
                                  >
                                    ...
                                  </span>
                                );
                              }
                              if (
                                page === totalPages - 1 &&
                                currentPage < totalPages - 3
                              ) {
                                return (
                                  <span
                                    key={page}
                                    className="px-2 text-gray-400"
                                  >
                                    ...
                                  </span>
                                );
                              }
                              return null;
                            }

                            return (
                              <button
                                key={page}
                                onClick={() => goToPage(page)}
                                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                                  currentPage === page
                                    ? "bg-blue-400 text-white"
                                    : "text-gray-600 hover:bg-gray-100"
                                }`}
                              >
                                {page}
                              </button>
                            );
                          })}
                        </div>

                        {/* Next Button */}
                        <button
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className={`p-2 rounded-lg transition-colors ${
                            currentPage === totalPages
                              ? "text-gray-400 cursor-not-allowed"
                              : "text-blue-400 hover:bg-blue-50"
                          }`}
                        >
                          <BiChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobBoard;
