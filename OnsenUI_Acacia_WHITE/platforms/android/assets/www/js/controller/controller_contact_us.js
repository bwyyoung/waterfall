/**
 * @controller contact_us
 * @desc controller for 'Contact Us' group of screens.
 */
Acacia.controller('contact_us', function ($scope) {
    $scope.groups = [];

    //HTML string for 'contact us' accordion group.
    $scope.contact_us = "<h3>Office</h3> " +
        "<div style='font-weight: bold'>Numoni P2P Marketplace Headquarters</div>" +
        "D-07-1 Plaza Kelana Jaya<br>" +
        "Jalan SS7/13A<br>" +
        "47301 Petaling Jaya<br>" +
        "Selangor Darul Ehsan<br>" +
        "Malaysia<br><br> " +
        "<h3>Email</h3> " +
        "<div style='font-weight: bold'>Investor Services & Questions: </div>" +
        "investorservices@numoni.com<br> " +
        "<div style='font-weight: bold'>Borrowers & General Questions: </div>" +
        "customerservice@numoni.com<br><br> " +
        "<h3>Telephone</h3> " +
        "+6012-9886207<br>";

    //HTML string for 'FAQ' accordion group.
    $scope.faq = "<h4>1.0	Will I know who the borrowers are?</h4>" +
        "No. You will be provided with demographic information about borrowers," +
        "such as their age, marital status, nationality, location and employment status," +
        "but you will not have access to any further sensitive identifying information about them. " +
        "<h4>2.0	Can I be both an Investor & a borrower?</h4>" +
        "No. " +
        "<h4>3.0	How do I withdraw my available credit or" +
        "investment funds from my account?</h4>" +
        "You can withdraw credit sitting in your investor account at any time." +
        "Go to My Profile > click [Withdraw]." +
        "You can withdraw up to the full amount of credit available in your account," +
        "however, funds that are currently invested and in funding cannot be withdrawn. " +
        "<br><br>";

    /**
     * @function slidemenu_open
     * @desc toggle the sliding menu
     */
    $scope.slidemenu_open = function () {
        app.slidingMenu.toggleMenu();
    };

    /**
     * @function is_menu_open
     * @returns {boolean}
     * if sliding menu is open, return true.
     */
    $scope.is_menu_open = function () {
        return scope_slidemenu_left.BOOL_SLIDING_MENU_OPEN;
    };

    /**
     * @function init
     * @desc initialise the controller,
     * with back button event registration,
     * and filling the accordion list for the screen
     */
    $scope.init = function () {
        $(document).on(EVENT_BACKBUTTON,
            function () {
                scope_slidemenu_left.page_load_home();
            }
        );
        $scope.groups[0] = {
            name: 'Contact Us',
            items: []
        };
        $scope.groups[0].items.push($scope.contact_us);
        $scope.groups[1] = {
            name: 'FAQ',
            items: []
        };
        $scope.groups[1].items.push($scope.faq);

    };

    $scope.init();

    /**
     * @function destroy
     * @desc kill backbutton event when the controller is destroyed
     */
    $scope.$on('$destroy', function () {
        app.slidingMenu.setSwipeable(false);
        $(document).off(EVENT_BACKBUTTON);
    });

    /**
     * @function toggleGroup
     * @desc Accordion toggle.
     * if given group is the selected group, deselect it
     * else, select the given group. Similar logic to Loan Marketplace Accordions
     */
    $scope.toggleGroup = function (group) {
        if ($scope.isGroupShown(group)) {
            $scope.shownGroup = null;
        } else {
            $scope.shownGroup = group;
        }
    };

    /**
     * @function isGroupShown
     * @param group
     * The dropdown accordion group
     * @returns {boolean}
     * if the shown group is of the same group as the group provided in parameter,
     * that means the parameter group IS SHOWN.
     * if not matching, then the parameter group SHOULD close, and be hidden,
     * while the other shown group can be shown
     */
    $scope.isGroupShown = function (group) {
        return $scope.shownGroup === group;
    };
});