// Clear browser cache script
// Add this to force browser to reload all assets

(function() {
    // Clear localStorage
    if (typeof localStorage !== 'undefined') {
        localStorage.clear();
    }
    
    // Clear sessionStorage
    if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
    }
    
    // Force reload without cache
    if (typeof location !== 'undefined') {
        location.reload(true);
    }
})();

console.log('Cache cleared, page reloaded');