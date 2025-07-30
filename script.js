// script.js

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const datePicker = document.getElementById('datePicker');
    const prevDayBtn = document.getElementById('prevDayBtn');
    const todayBtn = document.getElementById('todayBtn');
    const nextDayBtn = document.getElementById('nextDayBtn');
    const searchBar = document.getElementById('searchBar');
    const subjectFilter = document.getElementById('subjectFilter');
    const sourceFilter = document.getElementById('sourceFilter');
    const currentAffairsPostsContainer = document.getElementById('currentAffairsPosts');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const pageInfo = document.getElementById('pageInfo');
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');

    let allPosts = []; // Stores all fetched posts
    let filteredPosts = []; // Stores posts after date, search, and filter
    let currentPage = 1;
    const postsPerPage = 9;

    /**
     * Fetches current affairs data from data.json.
     * @returns {Promise<Array>} A promise that resolves to an array of post objects.
     */
    async function fetchPosts() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            // Sort posts by date in descending order (most recent first)
            return data.sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (error) {
            console.error('Error fetching current affairs data:', error);
            // Display a user-friendly message if data cannot be loaded
            currentAffairsPostsContainer.innerHTML = `
                <div class="col-span-full text-center text-red-600 p-4 bg-red-100 rounded-lg">
                    <p class="font-bold text-lg mb-2">Failed to load current affairs.</p>
                    <p>Please check your internet connection or try again later.</p>
                </div>
            `;
            return []; // Return empty array to prevent further errors
        }
    }

    /**
     * Initializes filters (subject and source dropdowns) based on available data.
     */
    function initializeFilters() {
        const subjects = new Set();
        const sources = new Set();

        allPosts.forEach(post => {
            // Split subjects by comma and trim whitespace, then add each to the set
            post.subject.split(',').forEach(subject => {
                subjects.add(subject.trim());
            });
            sources.add(post.source);
        });

        // Populate subject filter
        subjectFilter.innerHTML = '<option value="">All Subjects</option>';
        Array.from(subjects).sort().forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            subjectFilter.appendChild(option);
        });

        // Populate source filter
        sourceFilter.innerHTML = '<option value="">All Sources</option>';
        Array.from(sources).sort().forEach(source => {
            const option = document.createElement('option');
            option.value = source;
            option.textContent = source;
            sourceFilter.appendChild(option);
        });
    }

    /**
     * Renders the current affairs posts to the DOM.
     * @param {Array} postsToRender - The array of post objects to display.
     */
    function renderPosts(postsToRender) {
        currentAffairsPostsContainer.innerHTML = ''; // Clear existing posts

        if (postsToRender.length === 0) {
            currentAffairsPostsContainer.innerHTML = `
                <div class="col-span-full text-center text-gray-500 p-4 bg-gray-100 rounded-lg">
                    <p class="font-bold text-lg mb-2">No current affairs found for the selected criteria.</p>
                    <p>Try adjusting your date, search terms, or filters.</p>
                </div>
            `;
            return;
        }

        postsToRender.forEach(post => {
            const postElement = document.createElement('div');
            postElement.classList.add('bg-white', 'p-6', 'rounded-lg', 'shadow-lg', 'hover:shadow-xl', 'transition-all', 'duration-300', 'flex', 'flex-col', 'justify-between');

            postElement.innerHTML = `
                <div>
                    <span class="text-sm font-semibold text-blue-600 mb-2 block">${post.subject}</span>
                    <h3 class="text-xl font-bold text-gray-900 mb-3 leading-tight">
                        <a href="${post.link}" class="hover:text-blue-700 transition-colors duration-300">${post.title}</a>
                    </h3>
                    <p class="text-gray-600 text-sm mb-4 line-clamp-3">${post.summary}</p>
                    <div class="flex items-center text-gray-500 text-xs mb-4">
                        <i class="far fa-calendar-alt mr-2"></i>
                        <span>${new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        <span class="mx-2">•</span>
                        <i class="fas fa-newspaper mr-2"></i>
                        <span>${post.source}</span>
                    </div>
                </div>
                <div class="mt-4 flex flex-wrap gap-3">
                    <a href="${post.link}" class="inline-block bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400">
                        Read More <i class="fas fa-arrow-right ml-1 text-xs"></i>
                    </a>
                    ${post.resource_link ? `
                    <a href="${post.resource_link}" target="_blank" rel="noopener noreferrer" class="inline-block bg-green-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-400">
                        Resource <i class="fas fa-external-link-alt ml-1 text-xs"></i>
                    </a>` : ''}
                </div>
            `;
            currentAffairsPostsContainer.appendChild(postElement);
        });
    }

    /**
     * Filters posts based on the selected date, search query, subject, and source.
     */
    function applyFilters() {
        const selectedDate = datePicker.value;
        const searchTerm = searchBar.value.toLowerCase();
        const selectedSubject = subjectFilter.value; // "Ethics"
        const selectedSource = sourceFilter.value;

        filteredPosts = allPosts.filter(post => {
            const postDate = new Date(post.date).toISOString().split('T')[0]; // Format 'YYYY-MM-DD'

            // Date filter
            const dateMatch = !selectedDate || postDate === selectedDate;

            // Search filter (case-insensitive)
            const searchMatch = !searchTerm ||
                                post.title.toLowerCase().includes(searchTerm) ||
                                post.summary.toLowerCase().includes(searchTerm) ||
                                post.subject.toLowerCase().includes(searchTerm) ||
                                post.source.toLowerCase().includes(searchTerm);

            // Subject filter: Check if the post's subject string *contains* the selected subject
            // This handles posts with multiple subjects separated by commas.
            const subjectMatch = !selectedSubject || post.subject.split(',').map(s => s.trim()).includes(selectedSubject);


            // Source filter
            const sourceMatch = !selectedSource || post.source === selectedSource;

            return dateMatch && searchMatch && subjectMatch && sourceMatch;
        });

        currentPage = 1; // Reset to first page after filtering
        updatePagination();
        displayPostsForPage(currentPage);
    }

    /**
     * Displays a specific page of posts.
     * @param {number} page - The page number to display.
     */
    function displayPostsForPage(page) {
        const startIndex = (page - 1) * postsPerPage;
        const endIndex = startIndex + postsPerPage;
        const postsToDisplay = filteredPosts.slice(startIndex, endIndex);
        renderPosts(postsToDisplay);
    }

    /**
     * Updates the pagination controls (buttons and page info).
     */
    function updatePagination() {
        const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
        pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;

        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;

        // Hide pagination if there's only one page or no posts
        if (totalPages <= 1) {
            paginationControls.classList.add('hidden');
        } else {
            paginationControls.classList.remove('hidden');
        }
    }

    /**
     * Sets the date picker to a specific date and triggers a filter.
     * @param {Date} date - The date object to set.
     */
    function setAndFilterByDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        datePicker.value = `${year}-${month}-${day}`;
        applyFilters();
    }

    // Event Listeners

    // Date Picker and Navigation Buttons
    datePicker.addEventListener('change', applyFilters);

    prevDayBtn.addEventListener('click', () => {
        const currentDate = new Date(datePicker.value);
        currentDate.setDate(currentDate.getDate() - 1);
        setAndFilterByDate(currentDate);
    });

    todayBtn.addEventListener('click', () => {
        setAndFilterByDate(new Date());
    });

    nextDayBtn.addEventListener('click', () => {
        const currentDate = new Date(datePicker.value);
        currentDate.setDate(currentDate.getDate() + 1);
        setAndFilterByDate(currentDate);
    });

    // Search and Filter Dropdowns
    searchBar.addEventListener('input', applyFilters);
    subjectFilter.addEventListener('change', applyFilters);
    sourceFilter.addEventListener('change', applyFilters);

    // Pagination Buttons
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayPostsForPage(currentPage);
            updatePagination();
            scrollToTop(); // Scroll to top when changing page
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            displayPostsForPage(currentPage);
            updatePagination();
            scrollToTop(); // Scroll to top when changing page
        }
    });

    // Scroll to Top Button Logic
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) { // Show button after scrolling 300px
            scrollToTopBtn.classList.add('show');
            scrollToTopBtn.classList.remove('hide');
        } else {
            scrollToTopBtn.classList.add('hide');
            scrollToTopBtn.classList.remove('show');
        }
    });

    scrollToTopBtn.addEventListener('click', scrollToTop);

    /**
     * Smoothly scrolls the window to the top.
     */
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // Initial Load
    async function initializeApp() {
        allPosts = await fetchPosts();
        if (allPosts.length > 0) {
            initializeFilters();
            setAndFilterByDate(new Date()); // Set date picker to today and apply initial filter
        }
    }

    initializeApp();
});
