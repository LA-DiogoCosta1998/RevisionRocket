$( document ).ready(function() {
    var userRole = $("#userRole").text();


    // GLOBAL VARIABLES
    var subjectSelected;
    var qualificationLevelSelected;
    var topicSelected;

    var SUBJECT_INFO = [];    // An array of information about subjects
                              // INFO: subject name, a topics including a descripton of it

    $("#revisionTabs").hide();
    $("#TeacherAreaTabs").hide();
    //$("#quizAnswerModal").hide();

    filterUI();

    function filterUI() {
        if ($("#userRole").text() == "Student") {
            $("#teachersAreaBtn").hide();
            $("#teachersLeagueBtn").hide();
            $("#studentsAreaBtn").show();
            document.getElementById("studentsAreaBtn").innerHTML = "<a href='#'>" + $("#userForename").text() + "'s Area</a>"
            $("#studentAreaStudentName").text($("#userForename").text() + " " + $("#userSurname").text());
            $("#studentModalDashboard p:contains(' example@lambeth-academy.org')").html("<span class='glyphicon glyphicon-envelope'></span> " + $("#userEmail").text());
        }

        if ($("#userRole").text() == "Teacher") {
            $("#studentsAreaBtn").hide();
            $("#teachersAreaBtn").show();

            $("#welcomeTeacherModalHeader").text("Welcome " + $("#userForename").text() + " " + $("#userSurname").text());
            var newText = $("#welcomeTeacherModalBody2").text().replace("TEACHER_NAME", $("#userForename").text() + " " + $("#userSurname").text());
            document.getElementById("welcomeTeacherModalBody2").innerHTML = newText;
            $('#welcomeTeacherModal').modal('show');
        }

        // I.E. Diogo Costa is admin
        if ($("#userEmail").text() == "10dcosta@lambeth-academy.org") {
            // Becomes admin
            $("#teachersAreaBtn").show();
            $("#studentsAreaBtn").show();
            $("#teachersLeagueBtn").show();
            $("#userRole").text("Admin");
            userRole = $("#userRole").text();
        }

        $('#profileImage').attr('title', "Click here to sign out " + $("#userForename").text() + " " + $("#userSurname").text() + " (" + $("#userEmail").text() +")");
        $('input[name="contactUsName"]').val($("#userForename").text() + " " + $("#userSurname").text());
        $('input[name="contactUsEmail"]').val($("#userEmail").text());

        $('input[name="contactUsName"]').prop('disabled', true);
        $('input[name="contactUsEmail"]').prop('disabled', true);


    }

    // Populate Qualification and Topics

    // SUBJECT SELECTED
    $('#subjectList li').unbind().click(function() {
        subjectSelected = $(this).text();
        document.getElementById("subjectNameModalHeader").innerHTML = subjectSelected; // set modal header

        // Clear dropdown menus, then get info
        document.getElementById('topicsList').options.length = 0;
        document.getElementById('teacherTopicsDropdownList').options.length = 0;
        document.getElementById('qualificationList').options.length = 0;
        document.getElementById('teacherQualificationDropdownList').options.length = 0;

        getSubjectInfo();

        // Go back to filters, in case modal was open previously to another subject
        $("#filterSubject").show();
        $("#filterSubjectButtons").show();
        $("#revisionTabs").hide();
        $("#startQuizBtn").hide();

        $("#backToFilterBtn").hide();
        $("#updateFilterBtn").show();
    });

    $('[id^=revisionButton]').unbind().click(function() {
        var currentId = this.id;
        var subjectBoxId = currentId.replace("revisionButton", "subjectBox");
        subjectSelected = $("#" + subjectBoxId).text();
        document.getElementById("subjectNameModalHeader").innerHTML = subjectSelected; // set modal header

        // Clear dropdown menus, then get info
        document.getElementById('topicsList').options.length = 0;
        document.getElementById('teacherTopicsDropdownList').options.length = 0;
        document.getElementById('qualificationList').options.length = 0;
        document.getElementById('teacherQualificationDropdownList').options.length = 0;

        getSubjectInfo();

        $("#filterSubject").show();
        $("#filterSubjectButtons").show();
        $("#revisionTabs").hide();

        $("#startQuizBtn").hide();
        $("#updateFilterBtn").show();
    });

    $("#qualificationList").unbind().change(function() {
        document.getElementById('topicsList').options.length = 0;
        document.getElementById('teacherTopicsDropdownList').options.length = 0;
        getSubjectInfo();
    });

    // LOAD SUBJECT INFO

    function getSubjectInfo() {
        $.post("/getSubjectInfo", {
            subject: subjectSelected
    	},
    	function(data) {
    	    displaySubjectInfo(data, subjectSelected);
    	});
    }

    function displaySubjectInfo(data, subjectSelected) {
        $.each(JSON.parse(data), function(key, value) {
            SUBJECT_INFO.push({
                subject_name:   subjectSelected,
                qualification_level: value.qualification_level,
                topic_name: value.topic_name,
                topic_desc: value.topic_desc
            });
            // If there the current qualification level (e.g. A2), is not in the list, append it
            if ($("option:contains(" + value.qualification_level + ")", "#qualificationList").length == 0) {
                $('#qualificationList').append("<option>" + value.qualification_level + "</option>");
            }

            if ($("option:contains(" + value.qualification_level + ")", "#teacherQualificationDropdownList").length == 0) {
                $('#teacherQualificationDropdownList').append("<option>" + value.qualification_level + "</option>");
            }

            // If A2 is in the list, now begin to add the topic for it
            if (value.qualification_level == document.getElementById("qualificationList").value) {
                $('#topicsList').append("<option>" + value.topic_name + "</option>");
            }

            if (value.qualification_level == document.getElementById("teacherQualificationDropdownList").value) {
                $('#teacherTopicsDropdownList').append("<option>" + value.topic_name + "</option>");
            }
        });
    }

    // Update filter, hide filter and display tabs
    $('[id^=updateFilterBtn]').unbind().click(function() {
        // If student...
        if ($("#subjectModal").hasClass('in')) {
            qualificationLevelSelected = document.getElementById("qualificationList").value;
	        topicSelected = document.getElementById("topicsList").value;



            getTopicSummary();
            getTopicLeaderboard();
            //getRevisionMaterials();

            $("#filterSubject").hide();
            $("#filterSubjectButtons").hide();
            $("#revisionTabs").show();

            $("#updateFilterBtn").hide();
            $("#resetFilterBtn").hide();
            $("#backToFilterBtn").show();

            getQuestionsStudent();

            document.getElementById('subjectSummaryTab').click();
        }

        // If teacher...
        else if ($("#teacherModal").hasClass('in')) {
            subjectSelected = document.getElementById("teacherSubjectDropdownList").value;
            qualificationLevelSelected = document.getElementById("teacherQualificationDropdownList").value;
            topicSelected = document.getElementById("teacherTopicsDropdownList").value;

            $("#teacherFilterSubject").hide();
            $("#teacherFilterSubjectButtons").hide();
            $("#teacherAreaTabs").show();
        }

        $("#startQuizBtn").hide();
    });

    // Reset filters
    $('[id^=resetFilterBtn]').click(function() {
        if ($("#subjectModal").hasClass('in')) {
            document.getElementById('topicsList').options.length = 0;
            document.getElementById('qualificationList').options.length = 0;

            subjectSelected = document.getElementById("subjectNameModalHeader").innerHTML;
        }

        else if ($("#teacherModal").hasClass('in')) {
            $("select#teacherSubjectDropdownList").prop('selectedIndex', 0);
            document.getElementById('teacherTopicsDropdownList').options.length = 0;
            document.getElementById('teacherQualificationDropdownList').options.length = 0;

            subjectSelected = document.getElementById("teacherSubjectDropdownList").value;
        }

        getSubjectInfo();

        $("#startQuizBtn").hide();
    });

    // Back to filters
    $('[id^=backToFilterBtn]').click(function() {
        if ($("#subjectModal").hasClass('in')) {
            $('[href=#subjectSummary]').tab('show');
            $("#filterSubject").show();
            $("#filterSubjectButtons").show();
            $("#revisionTabs").hide();
            document.getElementById('resetFilterBtn').click(); // simulates a reset filter click
        }

        else if ($("#teacherModal").hasClass('in')) {
            $("#teacherFilterSubject").show();
            $("#teacherFilterSubjectButtons").show();
            $("#teacherAreaTabs").hide();
            document.getElementById('resetFilterBtn').click(); // simulates a reset filter click
        }

        $("#startQuizBtn").hide();
    });

    // GET QUESTIONS
    function getQuestionsStudent() {
        // Remove the previous results from the table
        $("#quizResultsModalReviewTable tbody").children().remove()

        $.post("/getQuestions", {
            subject: subjectSelected,
            qualification: qualificationLevelSelected,
    		topic: topicSelected
    	},
    	function(data) {
    	    data = JSON.parse(data);
    	    if (data.length >= 5) {
    	        questions = shuffle(data);
    	        quizLength = updateSlider(questions);

    	       //Enable the quiz tab
    	        $("#subjectQuizTab").parent('li').removeClass("disabled")
    	        $('#subjectQuizTab').attr('data-toggle', 'tab');
    	    }

    	    else {
    	        $("#subjectQuizTab").parent('li').addClass("disabled")
    	        $("#subjectQuizTab").removeAttr("data-toggle");
    	    }


            /*
    	    if ($("#subjectModal").hasClass('in') && questions.length > 0) {
    	        quizLength = updateSlider(questions);
    	    }

    	    else if ($("#teacherModal").hasClass('in') && questions.length > 0) {
    	        // LIST QUESTIONS, FOR QUESTION MANAGER
    	        document.getElementById('teacherQuestionsDropdownList').options.length = 0;
    	        $.each(questions, function(key, value) {
    	            $('#teacherQuestionsDropdownList').append("<option>" + value.question_name + "</option>");
    	        });

                $('#questionEditorCorrectOption label').removeClass("active");
                var questionIndex = $("#teacherQuestionsDropdownList")[0].selectedIndex;

                $('textarea#questionEditorQuestionText').val(questions[questionIndex].question_name);
                $("#questionEditorOptionA").val(questions[questionIndex].option_a);
                $("#questionEditorOptionB").val(questions[questionIndex].option_b);
                $("#questionEditorOptionC").val(questions[questionIndex].option_c);
                $("#questionEditorOptionD").val(questions[questionIndex].option_d);
                $("#questionEditorCorrectOption" + questions[questionIndex].correct_answer).parent().addClass("active");
                $("#questionEditorReason").val(questions[questionIndex].answer_reason);
    	    }

    	    else if (questions.length == 0) {
    	        quizLength = updateSlider(questions);
    	        alert("There are no available questions for " + qualificationLevelSelected + " " + subjectSelected + " - " + topicSelected)
    	    }
    	    */

    	});
    }

    $('[id^=subjectQuizTab]').unbind().click(function() {
        $("#startQuizBtn").show();
    });

    $('[id^=subjectSummaryTab]').unbind().click(function() {
        $("#startQuizBtn").hide();
    });

    function updateSlider(questions) {
        $('#quizLengthSlider').slider({
	        min: 5,
	        max: questions.length,
	        value: Math.round(questions.length / 2),
    	    formatter: function(value) {
    		    return 'Number of questions: ' + value;
    	    }
        });
    }

    $('[id^=startQuizBtn]').click(function() {
        $("#quizProgressBar").attr("aria-valuemax", quizLength);
        // RESET progress bar
        $('.progress-bar').css('width', '0%').attr('aria-valuenow', 0);

        quizQuestionManager(questions);
    });

    function quizQuestionManager(questions) {

        // IMPORTANT QUIZ VARIABLES
        var questionCounter = 0;
        var quizScore = 0;
        var quizLength = parseInt($('#quizLengthSlider').val());
        $("#quizScoreBadge").text(0);
        $("#quizPointsBadge").text(0);

        document.getElementById("quizSubmitAnswerBtn").disabled = false;

        $('#subjectModal').modal('hide');
        $('#quizQuestionModal').modal('show');

        displayQuestions(questions, questionCounter, quizScore, quizLength);
    }

    function displayQuestions(questions, questionCounter, quizScore, quizLength) {
        // Remove any radiobutton selection, from prev quizzes
        $("#quizAnswerOptions .btn-group button").removeClass("active");

        // Display question
        document.getElementById("quizQuestionNumber").innerHTML = "Question " + (questionCounter + 1); // plus one, since counter starts from 0
        document.getElementById("quizQuestionText").innerHTML = questions[questionCounter].question_name;
        $('#quizOptionA').get(0).nextSibling.data = questions[questionCounter].option_a;
        $('#quizOptionB').get(0).nextSibling.data = questions[questionCounter].option_b;
        $('#quizOptionC').get(0).nextSibling.data = questions[questionCounter].option_c;
        $('#quizOptionD').get(0).nextSibling.data = questions[questionCounter].option_d;

        $("#quizAnswerOptions").on("click", function() {
            document.getElementById("quizSubmitAnswerBtn").disabled = false;
        });

        // Unbind prevents it firing multiple times
        $('[id^=quizSubmitAnswerBtn]').unbind().click(function() {
            $("#quizProgressBar").attr("aria-valuenow", questionCounter + 1);
            $('.progress-bar').css('width', (questionCounter + 1) / quizLength * 100 +'%').attr('aria-valuenow', (questionCounter + 1) / quizLength * 100);
            $("#quizProgressBar").text(Math.round((questionCounter + 1) / quizLength * 100) + '%');

            checkAnswer(questionCounter, quizScore, quizLength);
        });
    }

    // Checks whether the answer is correct
    function checkAnswer(questionCounter, quizScore, quizLength) {
        var optionSelected = $('#quizAnswerOptions label.active input').val();
        var correctAnswer = questions[questionCounter].correct_answer;

        var newRowContent;

        $('#quizAnswerModal').modal('show');

        if (optionSelected == correctAnswer) {
            $("#quizAnswerReasonPanel").attr("class", "panel panel-success");
            $('#quizAnswerModal').data('bs.modal').$backdrop.css('background-color','green')
            document.getElementById("quizCorrectIncorrectModalHeader").innerHTML = "Correct!";

            // Green
            newRowContent = "<tr bgcolor=#ccffcc><td>" + document.getElementById("quizQuestionText").innerHTML + "</td><td>" + $('#quizAnswerOptions label.active input').get(0).nextSibling.data  + "</td><td>" + $('#quizOption' + questions[questionCounter].correct_answer).get(0).nextSibling.data + "</td><td>" + questions[questionCounter].answer_reason + "</td></tr>";

            quizScore++;
            $("#quizScoreBadge").text(quizScore);
            $("#quizPointsBadge").text(quizScore * 10);
        }

        else {
            $("#quizAnswerReasonPanel").attr("class", "panel panel-danger");
            $('#quizAnswerModal').data('bs.modal').$backdrop.css('background-color','red')
            document.getElementById("quizCorrectIncorrectModalHeader").innerHTML = "Incorrect!";

            // Red
            newRowContent = "<tr bgcolor=#ffe6e6><td>" + document.getElementById("quizQuestionText").innerHTML + "</td><td>" + $('#quizAnswerOptions label.active input').get(0).nextSibling.data  + "</td><td>" + $('#quizOption' + questions[questionCounter].correct_answer).get(0).nextSibling.data + "</td><td>" + questions[questionCounter].answer_reason + "</td></tr>";
        }

        // Reason applies to whether user got the question correct or not
        document.getElementById('quizCorrectIncorrectReason').innerHTML = questions[questionCounter].answer_reason;

        // Add the user option plus the correct answer to the result table
        $("#quizResultsModalReviewTable tbody").append(newRowContent);

        document.getElementById("quizSubmitAnswerBtn").disabled = true;

        $("#quizNextQuestionBtn").unbind().on("click", function() {
            questionCounter++;

            $('#quizAnswerOptions label.active input').parent().removeClass("active");
            $('#quizAnswerModal').modal('hide');

            if (questionCounter < quizLength) {
                displayQuestions(questions, questionCounter, quizScore, quizLength);
            }

            else {
                displayQuizData(questionCounter, quizScore)
            }
        });
    }

    // SUMMARY PAGE AFTER QUIZ
    function displayQuizData(questionCounter, quizScore) {
        $('#quizAnswerReasonPanel').modal('hide');
        $('#quizAnswerModal').modal('hide');
        $('#quizQuestionModal').modal('hide');

        document.getElementById("quizResultsModalQualificationLevel").innerHTML = qualificationLevelSelected;
        document.getElementById("quizResultsModalSubjectName").innerHTML = subjectSelected;
        document.getElementById("quizResultsModalTopicName").innerHTML = topicSelected;
        document.getElementById("quizResultsModalScore").innerHTML = quizScore;
        document.getElementById("quizResultsModalQuizLength").innerHTML = parseInt($('#quizLengthSlider').val());

        var quizPercentage = 0;
        var quizResultsImageLocation;

        // Score / Length of quiz
        quizPercentage = quizScore / parseInt($('#quizLengthSlider').val())
        quizPercentage = quizPercentage * 100
        quizPercentage = Math.round(quizPercentage)

        // Which image to use?
        if (quizPercentage < 50) {
            quizResultsImageLocation = "/static/images/red-smiley-face.png"
            $('#quizAnswerModal').data('bs.modal').$backdrop.css('background-color','red')
        }

        else if (quizPercentage < 75 && quizPercentage >= 50) {
            quizResultsImageLocation = "/static/images/yellow-neutral-face.png"
            $('#quizAnswerModal').data('bs.modal').$backdrop.css('background-color','#ffcc66')
        }

        else if (quizPercentage >= 75) {
            quizResultsImageLocation = "/static/images/green-happy-face.png"
            $('#quizAnswerModal').data('bs.modal').$backdrop.css('background-color','green')
        }

        $("#quizResultsModalImage").attr("src", quizResultsImageLocation);
        document.getElementById("quizResultsModalScorePercentage").innerHTML = quizPercentage + "%";

        $('#quizResultsModal').modal('show');

        if ($("#userRole").text() == "Student" || $("#userEmail").text() == "10dcosta@lambeth-academy.org") {
            storeQuizResults(quizScore);
        }

        quizResultsShowCorrectAnswers();
    }

    function storeQuizResults(quizScore) {
        $.post("/storeQuizResults", {
            qualification: qualificationLevelSelected,
    		topic: topicSelected,
    		subject: subjectSelected,
    		score: quizScore,
    		length: parseInt($('#quizLengthSlider').val()),
            date: new Date().toISOString().slice(0,10),
            email: $("#userEmail").text()
    	});
    	storeQuizPoints(quizScore);
    }


    function storeQuizPoints(quizScore) {
        var quizPoints = quizScore * 10;
        console.log(quizPoints, $("#userEmail").text())
        $.post("/storeQuizPoints", {
            email: $("#userEmail").text(),
            points: quizPoints
    	});
    }

    function quizResultsShowCorrectAnswers() {
        if(document.getElementById("quizResultsModalReviewIncorrectAnswers").checked == true) {
            $("#quizResultsModalReviewTable tbody").find("tr").each(function() { //get all rows in table
                if ($(this).css('background-color') == "rgb(204, 255, 204)") { // if answer is correct, view green background color
                    $(this).hide();
                }
            });
        }

        else {
            $("#quizResultsModalReviewTable tbody").find("tr").each(function() { //get all rows in table
                $(this).show();
            });
        }
    }

    $('#quizResultsModalReviewIncorrectAnswers').unbind().click(function() {
        quizResultsShowCorrectAnswers();
    });

    function getTopicSummary() {
        $.each(SUBJECT_INFO, function(key, value) {
            if (value.subject_name == subjectSelected && value.qualification_level == qualificationLevelSelected && value.topic_name == topicSelected) {
                $("#subjectTopicDesc").text(value.topic_desc)
            }
        });
    }

    function getTopicLeaderboard() {
        clearTable('#subjectTopicLeaderboard tbody');

        $.post("/getSubjectTopicLeaderboard", {
            subject: subjectSelected,
            topic: topicSelected,
            qualification: qualificationLevelSelected
    	},
    	function(data) {
            $.each(JSON.parse(data), function(key, value) {
                $("#subjectTopicLeaderboardData").append("<tr><td>" + (key + 1) + "</td><td>" + value.name + "</td><td>" + parseInt(value.average)  + "</td></tr>");
            });
        });
    }

    $('[id^=subjectRevisionPresentationsTab]').unbind().click(function() {
        getRevisionMaterials('Presentation');
    });

    $('[id^=subjectRevisionKeyWordsTab]').unbind().click(function() {
        getRevisionMaterials('Key Words');
    });

    $('[id^=subjectRevisionNotesTab]').unbind().click(function() {
        getRevisionMaterials('Notes');
    });

    $('[id^=subjectRevisionVideosTab]').unbind().click(function() {
        getRevisionMaterials('Videos');
    });

    function getRevisionMaterials(revisionType) {
        $("#revisionMaterialsPresentationsTable tbody").children().remove()
        $("#revisionMaterialsKeyWordsForm").children().remove()
        $("#revisionMaterialsRevisionNotesForm").children().remove()
        $("#revisionMaterialsRevisionVideosForm").children().remove()

        $.post("/getRevisionMaterials", {
            subject: subjectSelected,
            qualification: qualificationLevelSelected,
    		topic: topicSelected,
    		material_type: revisionType
    	},
    	function(data) {
            if(revisionType == "Presentation") {
                $.each(JSON.parse(data), function(key, value) {
                    var newRevisionMaterial = value.material_link;
                    newRevisionMaterial = newRevisionMaterial.replace("/edit?usp=sharing", "");
                    $('#subjectRevisionPresentations').append("<center><iframe src=" + newRevisionMaterial + "/embed?start=false&loop=true&delayms=15000 frameborder='1' allowfullscreen='true' mozallowfullscreen='true' webkitallowfullscreen='true'></iframe></center>");
                });

            }

            else if (revisionType == "Key Words") {
                $.each(JSON.parse(data), function(key, value) {
                    var newRevisionMaterial = value.material_link;
                    newRevisionMaterial = newRevisionMaterial.replace("/edit?usp=sharing", "/export?format=pdf");
                    $('#subjectRevisionKeyWords').append("<center><iframe src=" + newRevisionMaterial + "pub? frameborder='1'></iframe></center>");
                });
            }

            else if (revisionType == "Notes") {
                $.each(JSON.parse(data), function(key, value) {
                    var newRevisionMaterial = value.material_link;
                    newRevisionMaterial = newRevisionMaterial.replace("/edit?usp=sharing", "/export?format=pdf");
                    //PDFObject.embed(newRevisionMaterial, "#subjectRevisionNotes");
                    //$('#subjectRevisionNotes').append("<center><iframe src=" + newRevisionMaterial + "pub? frameborder='1'></iframe></center>");
                });
            }

            else if (revisionType == "Videos") {
                $.each(JSON.parse(data), function(key, value) {
                    var newRevisionMaterial = value.material_link;
                    newRevisionMaterial = newRevisionMaterial.replace("https://www.youtube.com/watch?v=", "");
                    var youtubeStartLink = "https://www.youtube.com/embed/"
                    $('#subjectRevisionVideos').append("<center><iframe src=" + youtubeStartLink + newRevisionMaterial + " frameborder='0' allowfullscreen></iframe><center>");
                });
            }
        });
    }

    $('[id^=subjectExamQuestions]').unbind().click(function() {
        getExamQuestions();
    });

    function getExamQuestions() {
        //$("#revisionMaterialsPresentationForm").children().remove()
        //$("#revisionMaterialsKeyWordsForm").children().remove()
        //$("#revisionMaterialsRevisionNotesForm").children().remove()
        //$("#revisionMaterialsRevisionVideosForm").children().remove()

        $.post("/getRevisionMaterials", {
            subject: subjectSelected,
            qualification: qualificationLevelSelected,
    		topic: topicSelected,
    		material_type: revisionType
    	},
    	function(data) {
    	    PDFObject.embed("myfile.pdf", "#my-container", {page: "2"});
        });
    }

    // STUDENT'S AREA
    $('#studentsAreaBtn').unbind().click(function() {
        clearTable('#studentAreaLeaderboard tbody');

        // Place the summary tag as selected
        $("#studentAreaLeagueTab").tab('show');

        loadStudentLeaderboard();
        getStudentQuizResults();

        $("#studentModal").modal('show');

        // Need this otherwise, modal is too slow and if statement will state that the modal is closed.
        // While in fact it is just taking a while for it to open
        $('#teacherModal').on('shown.bs.modal', function () {
    	    // Load qualification and topics as well
    	    subjectSelected = document.getElementById("teacherSubjectDropdownList").value;
    	    getSubjectInfo();

    	    // Prevents this event from firing multiple times
    	    $(this).off('shown.bs.modal');
        });

    });

    function getStudentQuizResults() {
        $.post("/getStudentQuizResults", {
            email: $("#userEmail").text(),
    	},
    	function(data) {
    	    if (data.length > 0) {
    	        // Create collapisble boxes for each subject and qualification
    	        getUniqueSubjectTopics(data);

    	        //quizResults = JSON.parse(data);
    	        //studentPerformanceGraph = createStudentPerformanceGraph();
    	        //studentTopicResultData = segregateStudentResultsData(quizResults);
    	        //addStudentResultsToGraph(quizResults, studentPerformanceGraph);
                //studentPerformanceGraph.render();

    	        $("#studentAreaPerformanceTab").parent('li').removeClass("disabled")
    	        $('#studentAreaPerformanceTab').attr('data-toggle', 'tab');
    	    }

            //displayQuizResultsOnGraph(quizResults);
        });
    }

    function getUniqueSubjectTopics(data) {
        var uniqueSubjectTopicData = [];

        uniqueSubjectTopicData.push({qualification: data[0].qualification_level, subject: data[0].subject_name});

        for (i = 1; i < data.length; i++) {
            // If student is the same as previous continue adding results for that student
            if (data[i - 1].subject_name == data[i].subject_name && data[i - 1].qualification_level == data[i].qualification_level) {
                uniqueSubjectTopicData.push({qualification: data[i].qualification_level, subject: data[i].subject_name});
            }
        }

        console.log(uniqueSubjectTopicData)
    }

    function createStudentPerformanceGraph() {
        var studentPerformanceGraph = new CanvasJS.Chart("studentPerformanceChartContainer",{
            zoomEnabled: true,
            panEnabled: true,
            animationEnabled: true,
            animationDuration: 1500,
            exportEnabled: true,
            //The g character means to repeat the search through the entire string
            exportFileName: ("QuizResults - " + $('#userForename').text() + " " + $('#userSurname').text()),
            title:{
                text:"Quiz Results"
            },
    		subtitles:[
    		{
    			text: $('#userForename').text() + " " + $('#userSurname').text(),
    			fontColor: "red"
    		}
    		],
    		toolTip: {
    			shared: false,
    			animationEnabled: true,
    			contentFormatter: function (e) {
    				var content = " ";
    				for (var i = 0; i < e.entries.length; i++) {
    					content += "Subject/Topic: <strong>" + e.entries[i].dataSeries.name + "</strong><br>";
    					content += "Percentage: <strong>" + e.entries[i].dataPoint.y + "%</strong><br>";
    					content += "Date Taken: <strong>" + CanvasJS.formatDate( e.entries[i].dataPoint.x, "DD MMM YY") + "</strong><br>";
    				}
    				return content;
    			}
		    },
            axisX:{
    			labelFormatter: function (e) {
    				return CanvasJS.formatDate( e.value, "DD MMM");
    			},
    			labelAngle: -20,
    			title: "Date Assessed",
            },
            axisY:{
    			title: "Percentage",
    			maximum: 105, // Ability to see the line at 100%
    			interval: 25,
    			suffix: "%",
    			stripLines:[
    			{
    				value:50,
    				labelPlacement:"inside",
    				label: "Minimum Pass Requirement",
    			}
    			],
    		},
    		legend: {
    		    cursor: "pointer",
                itemclick: function (e) {
                    if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                        e.dataSeries.visible = false;
                    }

                    else {
                        e.dataSeries.visible = true;
                    }
                    e.chart.render();
                }
            },
            data: []
        });
        return studentPerformanceGraph;
    }

    //function displayQuizResultsOnGraph(data) {
    //
    //}

    function segregateStudentResultsData() {

    }

    function addStudentResultsToGraph(studentData, graph) {
        $.each(studentData, function(key, value) {

            var result = []

            result.push({x: new Date(value.date_taken), y: parseInt(value.percentage)});

            var newData = {
                showInLegend: true,
                type: "spline",
                dataPoints: result
            };
            graph.options.data.push(newData);
        });
    }

    function clearTable(tableReference) {
        $(tableReference).children().remove();
    }

    $('#subjectTopicFilterLeaderboardBtn').unbind().click(function() {
        var $panel = $(this).parents('#subjectTopicLeaderboardTable'),
        $filters = $panel.find('.filters input'),
        $tbody = $panel.find('.table tbody');

        if ($filters.prop('disabled') == true) {
            $filters.prop('disabled', false);
            $filters.first().focus();
        }

        else {
            $filters.val('').prop('disabled', true);
            $tbody.find('.no-result').remove();
            $tbody.find('tr').show();
        }

    });

    $('#studentAreaFilterLeaderboardBtn').unbind().click(function() {
        var $panel = $(this).parents('#studentAreaLeaderboardTable'),
        $filters = $panel.find('.filters input'),
        $tbody = $panel.find('.table tbody');

        if ($filters.prop('disabled') == true) {
            $filters.prop('disabled', false);
            $filters.first().focus();
        }

        else {
            $filters.val('').prop('disabled', true);
            $tbody.find('.no-result').remove();
            $tbody.find('tr').show();
        }

    });

    $('#teacherAreaFilterLeaderboardBtn').unbind().click(function() {
        var $panel = $(this).parents('#teacherAreaLeaderboardTable'),
        $filters = $panel.find('.filters input'),
        $tbody = $panel.find('.table tbody');

        if ($filters.prop('disabled') == true) {
            $filters.prop('disabled', false);
            $filters.first().focus();
        }

        else {
            $filters.val('').prop('disabled', true);
            $tbody.find('.no-result').remove();
            $tbody.find('tr').show();
        }

    });

    $('.filterable .filters input').keyup(function(e){
        /* Ignore tab key */
        var code = e.keyCode || e.which;
        if (code == '9') return;
        /* Useful DOM data and selectors */
        var $input = $(this),
        inputContent = $input.val().toLowerCase(),
        $panel = $input.parents('.filterable'),
        column = $panel.find('.filters th').index($input.parents('th')),
        $table = $panel.find('.table'),
        $rows = $table.find('tbody tr');
        /* Dirtiest filter function ever ;) */
        var $filteredRows = $rows.filter(function(){
            var value = $(this).find('td').eq(column).text().toLowerCase();
            return value.indexOf(inputContent) === -1;
        });
        /* Clean previous no-result if exist */
        $table.find('tbody .no-result').remove();
        /* Show all rows, hide filtered ones (never do that outside of a demo ! xD) */
        $rows.show();
        $filteredRows.hide();
        /* Prepend no-result row if all rows are filtered */
        if ($filteredRows.length === $rows.length) {
            $table.find('tbody').prepend($('<tr class="no-result text-center"><td colspan="'+ $table.find('.filters th').length +'">No result found</td></tr>'));
        }
    });

    // TEACHER'S AREA
    $('#teachersAreaBtn').unbind().click(function() {
        document.getElementById("teacherSubjectDropdownList").options.length = 0;

        // Place the summary tag as selected
        $("#teacherAreaDashboardTab").tab('show');

        // Waste of resources/time going back to the server,
        // just get subjects from the subjects dropdown
        $('#subjectList li').each(function(index, value) {
            $('#teacherSubjectDropdownList').append("<option>" + value.innerText + "</option>");
        });

        subjectSelected = document.getElementById("teacherSubjectDropdownList").value;
        getSubjectInfo();

        $("#teacherAreaLeaderboard tbody").children().remove()
        getTeacherPoints();

        $("#teacherModal").modal('show');
    });

    $("#teacherSubjectDropdownList").change(function() {
       subjectSelected = document.getElementById("teacherSubjectDropdownList").value;

       qualificationLevelSelected = document.getElementById("teacherQualificationDropdownList").options.length = 0;
       topicSelected = document.getElementById("teacherTopicsDropdownList").options.length = 0;

       getSubjectInfo();
    });

    $("#teacherQualificationDropdownList").change(function() {
       topicSelected = document.getElementById("teacherTopicsDropdownList").options.length = 0;
       qualificationLevelSelected = document.getElementById("teacherQualificationDropdownList").value;
       getSubjectInfo();
    });

    function getTeacherPoints() {
        $.get("/getTeacherPoints", function (data) {
            $.each(JSON.parse(data), function(key, value) {
                if ($("#userEmail").text() == value.email_address) {
                    $("#teacherLeaderboardDataTable").append("<tr><td><b>" + (key + 1) + "</td><td>" + value.name + "</td><td>" + value.points  + "</td></tr></b>");
                    $("#teacherPoints").text(value.points + " points");
                    //$('#teacherDashboardImage').attr("src", $("#profileImage").attr('src'));
                }

                else {
                    $("#teacherLeaderboardDataTable").append("<tr><td><b>" + (key + 1) + "</td><td>" + value.name + "</td><td>" + value.points  + "</td></tr></b>");
                }
            });

            $('#teacherDashboardImage').attr("src", $("#profileImage").attr('src') + "?sz=120");
            $('#teacherLeagueName').text($('#userForename').text() + " " + $('#userSurname').text());
        });
    }

    function loadStudentLeaderboard() {
        $.get("/getStudentPoints", function (data) {
            $.each(JSON.parse(data), function(key, value) {
                if ($("#userEmail").text() == value.email_address) {
                    $("#studentAreaLeaderboardData").append("<tr><td><b>" + (key + 1) + "</td><td>" + value.name + "</td><td>" + value.points  + "</td></tr></b>");
                    $("#studentPoints").text(value.points + " points");
                }

                else {
                    $("#studentAreaLeaderboardData").append("<tr><td>" + (key + 1) + "</td><td>" + value.name + "</td><td>" + value.points  + "</td></tr>");
                }
            });

            $('#studentDashboardImage').attr("src", $("#profileImage").attr('src') + "?sz=120");
            $('#studentLeagueName').text($('#userForename').text() + " " + $('#userSurname').text());
        });
    }

    $('#questionEntrySubmit').click(function() {
        var questionEntryText = $('textarea#questionEntryText').val();
        var questionEntryOptionA = $("#questionEntryOptionA").val();
        var questionEntryOptionB = $("#questionEntryOptionB").val();
        var questionEntryOptionC = $("#questionEntryOptionC").val();
        var questionEntryOptionD = $("#questionEntryOptionD").val();
        var questionEntryCorrectOption = $("input[name='questionEntryOptions']:checked").val();
        var questionEntryReason = $("#questionEntryReason").val();

        submitQuestion(questionEntryText, questionEntryOptionA, questionEntryOptionB, questionEntryOptionC, questionEntryOptionD, questionEntryCorrectOption, questionEntryReason);
    });

    function submitQuestion(questionEntryText, questionEntryOptionA, questionEntryOptionB, questionEntryOptionC, questionEntryOptionD, questionEntryCorrectOption, questionEntryReason) {
        $.post("/submitQuestion", {
            subject: subjectSelected,
            qualification: qualificationLevelSelected,
    		topic: topicSelected,
    		question: questionEntryText,
    		optionA: questionEntryOptionA,
    		optionB: questionEntryOptionB,
    		optionC: questionEntryOptionC,
    		optionD: questionEntryOptionD,
    		correctOption: questionEntryCorrectOption,
    		questionReason: questionEntryReason
        });
    }

    function storeUploadedQuestions() {
        console.log("Storing questions")
        $.each(uploadedQuestionsAnswers, function(index, value) {
            console.log(subjectSelected, qualificationLevelSelected, topicSelected)
            $.post("/submitQuestion", {
                subject: subjectSelected,
                qualification: qualificationLevelSelected,
                topic: topicSelected,
                question: value.question_name,
                optionA: value.option_a,
                optionB: value.option_b,
                optionC: value.option_c,
                optionD: value.option_d,
                correctOption: value.correct_answer,
                questionEntryReason: value.answer_reason
            });
        });
    }

    $('#teacherQuestionsDropdownList').change(function() {
        //$("#questionEditorCorrectOption .btn-group button").removeClass("active");
        $('#questionEditorCorrectOption label').removeClass("active");
        var questionIndex = $("#teacherQuestionsDropdownList")[0].selectedIndex;

        $('textarea#questionEditorQuestionText').val(questions[questionIndex].question_name);
        $("#questionEditorOptionA").val(questions[questionIndex].option_a);
        $("#questionEditorOptionB").val(questions[questionIndex].option_b);
        $("#questionEditorOptionC").val(questions[questionIndex].option_c);
        $("#questionEditorOptionD").val(questions[questionIndex].option_d);
        $("#questionEditorCorrectOption" + questions[questionIndex].correct_answer).parent().addClass("active");
        $("#questionEditorReason").val(questions[questionIndex].answer_reason);
    });

    $('#questionEditorDiscardChanges').click(function() {
        $('#teacherQuestionsDropdownList').change(); // simulates a question change, thus doing has been programmed above
    });

    $('#questionEditorSubmitButton').click(function() {
        var questionEntryText = $('textarea#questionEntryText').val();
        var questionEntryOptionA = $("#questionEntryOptionA").val();
        var questionEntryOptionB = $("#questionEntryOptionB").val();
        var questionEntryOptionC = $("#questionEntryOptionC").val();
        var questionEntryOptionD = $("#questionEntryOptionD").val();
        var questionEntryCorrectOption = $("input[name='questionEntryOptions']:checked").val();
        var questionEntryReason = $("#questionEntryReason").val();

        submitQuestion(questionEntryText, questionEntryOptionA, questionEntryOptionB, questionEntryOptionC, questionEntryOptionD, questionEntryCorrectOption, questionEntryReason);
    });

/*
    function loadStudentsAvaliable() {
        document.getElementById('studentResultsStudentDropdown').options.length = 0;
        $.post("/loadStudentsAvaliable", {
        },
    	function(data) {
    	    $.each(JSON.parse(data), function(key, value) {
    	        $('#studentResultsStudentDropdown').append("<option>" + value.name + "</option>");
            });
    	});
    }
*/
    function loadStudentResult() {
        $.post("/loadStudentResult", {
            subject: subjectSelected,
            qualification: qualificationLevelSelected,
    		topic: topicSelected,
    		role: $("#userRole").text(),
    		email: $("#userEmail").text()
        },
    	function(data) {
    	    // Results that are returned are those students whom have taken the quiz multiple times
    	    // One point on the graph doesn't make sense
    	    if ($("#userRole").text() == "Teacher" || $("#userEmail").text() == "10dcosta@lambeth-academy.org") {
    	        resultGraph = renderGraph(JSON.parse(data));
    	        createResultGraph(JSON.parse(data), resultGraph);
    	    }

    	    if ($("#userRole").text() == "Student" ) {
                console.log(JSON.parse(data))
    	    }
    	});
    }

    function renderGraph(data) {
        var chart = new CanvasJS.Chart("chartContainer",{
            zoomEnabled: true,
            panEnabled: true,
            animationEnabled: true,
            animationDuration: 1500,
            exportEnabled: true,
            //The g character means to repeat the search through the entire string
            exportFileName: ("QuizResults-" + qualificationLevelSelected + subjectSelected + topicSelected).replace(/ /g,''),
            title:{
                text:"Quiz Results (all students)"
            },
    		subtitles:[
    		{
    			text: qualificationLevelSelected + " " + subjectSelected + " - " + topicSelected,
    			fontColor: "red"
    		}
    		],
    		toolTip: {
    			shared: false,
    			animationEnabled: true,
    			contentFormatter: function (e) {
    				var content = " ";
    				for (var i = 0; i < e.entries.length; i++) {
    					content += "Student: <strong>" + e.entries[i].dataSeries.name + "</strong><br>";
    					content += "Percentage: <strong>" + e.entries[i].dataPoint.y + "%</strong><br>";
    					content += "Date Taken: <strong>" + CanvasJS.formatDate( e.entries[i].dataPoint.x, "DD MMM YY") + "</strong><br>";
    				}
    				return content;
    			}
		    },
            axisX:{
    			labelFormatter: function (e) {
    				return CanvasJS.formatDate( e.value, "DD MMM");
    			},
    			labelAngle: -20,
    			title: "Date Assessed",
            },
            axisY:{
    			title: "Percentage",
    			maximum: 105, // Ability to see the line at 100%
    			interval: 25,
    			suffix: "%",
    			stripLines:[
    			{
    				value:50,
    				labelPlacement:"inside",
    				label: "Minimum Pass Requirement",
    			}
    			],
    		},
    		legend: {
    		    cursor: "pointer",
                itemclick: function (e) {
                    if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                        e.dataSeries.visible = false;
                    }

                    else {
                        e.dataSeries.visible = true;
                    }
                    e.chart.render();
                }
            },
            data: []
        });

        chart.render();
        return chart;
    }

    function createResultGraph(data, resultGraph) {
        var results = [];

        results.push({x: new Date(data[0].date_taken), y: parseInt(data[0].percentage)});

        for (i = 1; i < data.length; i++) {
            // If student is the same as previous continue adding results for that student
            if (data[i - 1].name == data[i].name) {
                var studentName = data[i].name;
                results.push({x: new Date(data[i].date_taken), y: parseInt(data[i].percentage)});
            }

            else {
                var newStudentIndex = i;
                addDataToGraph(results, studentName, resultGraph);
                var results = []; // clears array, by overwritting
                results.push({x: new Date(data[newStudentIndex].date_taken), y: parseInt(data[newStudentIndex].percentage)});
            }
        }

        // Loop ends add the last student to the graph
        addDataToGraph(results, studentName, resultGraph);
        calculateOverallAverageResults();
        resultGraph.render();
    }

    function addDataToGraph(results, studentName, resultGraph) {
        var newData = {
            name: studentName,
            showInLegend: true,
            type: "spline",
            dataPoints: results
        };
        resultGraph.options.data.push(newData);
    }

    function calculateOverallAverageResults() {
        var averageOverallResult;
        var averageStudentResults = 0;

        for (i = 0; i < resultGraph.options.data.length; i++) {
            var averageResult = 0;
            for (j = 0; j < resultGraph.options.data[i].dataPoints.length; j++) {
                averageResult += (resultGraph.options.data[i].dataPoints[j].y / resultGraph.options.data[i].dataPoints.length);
            }
            averageStudentResults += averageResult;
        }
        // Average student resultsa (totalled) divided by the number of students
        averageOverallResult = Math.round((averageStudentResults / resultGraph.options.data.length))

        var newStripline = {
            value:averageOverallResult,
            labelPlacement:"inside",
            lineDashType: "dash",
            color:"black",
            labelFontColor:"black",
    		label: "Average Result (" + averageOverallResult + "%)",
    		labelAlign: "near" // due to potential overlapping
        };
        resultGraph.options.axisY.stripLines.push(newStripline);
    }

    $('a[data-toggle="tab"]').on('shown.bs.tab', function () {
        loadStudentResult();
        // Resizes the graph, without this graph will not resize
        //resultGraph.render();

        $(this).off('shown.bs.tab');
    });

    $('[id^=contactUsSubmit]').unbind().click(function() {
        $('input[name="contactUsName"]').prop('disabled', false);
        $('input[name="contactUsEmail"]').prop('disabled', false);
    });

    // LOG OUT
    $('[id^=profileImage]').click(function() {
        $.confirm({
            title: 'Sign out?',
            content: 'Are you sure you wish to sign out?',
            buttons: {
                yes: function () {
                    window.location.replace("http://diogocosta1998.pythonanywhere.com/logout");
                },
                no: function () {
                }
            }
        });
    });

    // Fisher–Yates shuffle
    function shuffle(array) {
        var currentIndex = array.length, temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    }

    /*

	function initPicker() {
		var picker = new FilePicker({
			apiKey: 'AIzaSyAl5Fy4rpnq5oUcEy_XtpMjoys1IfT8YqI',
			clientId: '859852150837-kcmjf8cet58m541a3lb9soi1g6cn50ug',
			buttonEl: document.getElementById('subjectRevisionKeyWordsTab'),
			onSelect: function(file) {
				console.log(file);
			}
		});
	}
	*/
});