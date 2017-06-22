from __future__ import print_function
from flask import Flask, render_template, request, session, redirect, url_for
from flask_mail import Mail, Message
from sqlalchemy import create_engine
import sys, json, itertools, urllib, requests

connectionURL = "mysql+mysqlconnector://DiogoCosta1998:adminadmin@DiogoCosta1998.mysql.pythonanywhere-services.com/DiogoCosta1998$RevisionQuiz"

# 'pool_recycle' - avoid issues of unable to connect to the SQL database
engine = create_engine(connectionURL, pool_recycle=280)

DEBUG = True

app = Flask(__name__)
app.config.update(
    DEBUG=True,
	MAIL_SERVER='smtp.gmail.com',
	MAIL_PORT=465,
	MAIL_USE_SSL=True,
	MAIL_USERNAME = '10dcosta@lambeth-academy.org',
	# "Decrypt" password
	MAIL_PASSWORD = ''.join(str(chr(number)) for number in [83, 105, 109, 97, 111, 56, 53, 55, 57])
)
mail = Mail(app)
app.secret_key = 'ComputerScienceIsAmazing!' # :)

redirect_uri = 'http://diogocosta1998.pythonanywhere.com/callback'
client_id = '859852150837-kcmjf8cet58m541a3lb9soi1g6cn50ug.apps.googleusercontent.com'
client_secret = 'fwsedpyEiCuPxa2ZtxcwZH5F'

auth_uri = 'https://accounts.google.com/o/oauth2/auth'
token_uri = 'https://accounts.google.com/o/oauth2/token'
scope = ('https://www.googleapis.com/auth/userinfo.profile',
         'https://www.googleapis.com/auth/userinfo.email')
profile_uri = 'https://www.googleapis.com/oauth2/v1/userinfo'

@app.route('/')
def index():
    if 'email' not in session:
        return redirect(url_for('login'))

    else:
        try:
            connection = engine.connect()
            subjects = connection.execute("SELECT DISTINCT subject_name, image_link FROM Subjects ORDER BY subject_name ASC")
            connection.close()

        except Exception as e:
            print(str(e), file=sys.stderr)
            # Try again
            return redirect(url_for('index'))

        subjects1, subjects2 = itertools.tee(subjects)

        print(session['email'], file=sys.stderr)

        return render_template("index.html", subjects1=subjects1, subjects2=subjects2, profilePicture=session['picture'],
        userRole=session['role'], userForename=session['given_name'], userSurname=session['family_name'], userEmail=session['email'])

# GET INFO FROM SQL DATABASE
@app.route('/getSubjectInfo', methods=["POST"])
def getSubjectInfo():
    if request.method == "POST":
        subjectSelected = request.form["subject"]
        try:
            connection = engine.connect()
            subjectInfo = connection.execute("SELECT DISTINCT Subjects.qualification_level, Topics.topic_name, Topics.topic_desc FROM Subjects INNER JOIN Topics on Subjects.subject_id=Topics.subject_id WHERE Subjects.subject_name='" + subjectSelected + "' ORDER BY qualification_level ASC")
            connection.close()

        except Exception as e:
            return str(e)

    return json.dumps([dict(qualificationTopic) for qualificationTopic in subjectInfo])

@app.route('/getSubjectTopicLeaderboard', methods=["POST"])
def getSubjectTopicLeaderboard():
    if request.method == "POST":
        subjectSelected = request.form["subject"]
        topicSelected = request.form["topic"]
        qualificationSelected = request.form["qualification"]
        try:
            connection = engine.connect()
            topicAverages = connection.execute("SELECT AverageTopicResults.average, Students.name FROM Subjects INNER JOIN Topics ON Subjects.subject_id=Topics.subject_id AND Subjects.qualification_level='" + qualificationSelected + "' AND Subjects.subject_name='" + subjectSelected + "' INNER JOIN AverageTopicResults ON AverageTopicResults.topic_id=Topics.topic_id AND Topics.topic_name='" + topicSelected + "' INNER JOIN Students ON AverageTopicResults.email_address=Students.email_address ORDER BY AverageTopicResults.average ASC")
            connection.close()

        except Exception as e:
            return str(e)

    return json.dumps([dict(average) for average in topicAverages], default=str)

@app.route('/getQuestions', methods=["POST"])
def getQuestions():
    if request.method == "POST":
        subjectSelected = request.form["subject"]
        qualificationSelected = request.form["qualification"]
        topicSelected = request.form["topic"]
        try:
            connection = engine.connect()
            questions = connection.execute("SELECT QuestionsAnswers.question_name, QuestionsAnswers.option_a, QuestionsAnswers.option_b, QuestionsAnswers.option_c, QuestionsAnswers.option_d, QuestionsAnswers.correct_answer, QuestionsAnswers.answer_reason FROM QuestionsAnswers INNER JOIN Topics ON Topics.topic_name='" + topicSelected + "' INNER JOIN Subjects ON Subjects.subject_id=Topics.topic_id AND Subjects.qualification_level='" + qualificationSelected + "' AND Subjects.subject_name='" + subjectSelected + "'")
            connection.close()

        except Exception as e:
            return str(e)

    #random.shuffle(questions) # Suffles lists then sends it off
    return json.dumps([dict(question) for question in questions])

@app.route('/getRevisionMaterials', methods=["POST"])
def getRevisionMaterials():
    if request.method == "POST":
        subjectSelected = request.form["subject"]
        qualificationSelected = request.form["qualification"]
        topicSelected = request.form["topic"]
        materialType = request.form["material_type"]
        #print('DEBUG: Method= ' + subjectSelected + " " + qualificationSelected, file=sys.stderr)

        try:
            connection = engine.connect()
            revisionMaterials = connection.execute("SELECT Subjects.subject_name, Topics.topic_name, RevisionMaterials.material_link, RevisionMaterials.material_type FROM Subjects INNER JOIN Topics ON Subjects.subject_id=Topics.subject_id AND Subjects.qualification_level='" + qualificationSelected + "' AND Subjects.subject_name='" + subjectSelected + "' INNER JOIN RevisionMaterials ON RevisionMaterials.topic_id=Topics.topic_id AND Topics.topic_name='" + topicSelected + "' AND RevisionMaterials.material_type='" + materialType + "'")
            connection.close()

        except Exception as e:
            return str(e)

    else:
        print('DEBUG: not working', file=sys.stderr)

    return json.dumps([dict(revisionMaterial) for revisionMaterial in revisionMaterials])

@app.route('/uploadRevisionMaterials', methods=["POST"])
def uploadRevisionMaterials():
    if request.method == "POST":
        subjectSelected = request.form["subject"]
        qualificationSelected = request.form["qualification"]
        topicSelected = request.form["topic"]
        materialType = request.form["material_type"]
        #print('DEBUG: Method= ' + subjectSelected + " " + qualificationSelected, file=sys.stderr)

        try:
            connection = engine.connect()
            revisionMaterials = connection.execute("SELECT Subjects.subject_name, Topics.topic_name, RevisionMaterials.material_link, RevisionMaterials.material_type FROM Subjects INNER JOIN Topics ON Subjects.subject_id=Topics.subject_id AND Subjects.qualification_level='" + qualificationSelected + "' AND Subjects.subject_name='" + subjectSelected + "' INNER JOIN RevisionMaterials ON RevisionMaterials.topic_id=Topics.topic_id AND Topics.topic_name='" + topicSelected + "' AND RevisionMaterials.material_type='" + materialType + "'")
            connection.close()

        except Exception as e:
            return str(e)

    else:
        print('DEBUG: not working', file=sys.stderr)

    return json.dumps([dict(revisionMaterial) for revisionMaterial in revisionMaterials])

@app.route('/getExamQuestions', methods=["POST"])
def getExamQuestions():
    if request.method == "POST":
        subjectSelected = request.form["subject"]
        qualificationSelected = request.form["qualification"]
        topicSelected = request.form["topic"]

        try:
            connection = engine.connect()
            examQuestions = connection.execute("SELECT Subjects.subject_name, Topics.topic_name, ExamQuestions.exam_question_text, ExamQuestions.candidate_response, ExamQuestions.examiner_response, ExamQuestions.marks_awarded, ExamQuestions.marks_available FROM Subjects INNER JOIN Topics ON Subjects.subject_id=Topics.subject_id AND Subjects.qualification_level='" + qualificationSelected + "' AND Subjects.subject_name='" + subjectSelected + "' INNER JOIN RevisionMaterials ON RevisionMaterials.topic_id=Topics.topic_id AND Topics.topic_name='" + topicSelected + "' AND RevisionMaterials.material_type='" + materialType + "'")
            connection.close()

        except Exception as e:
            return str(e)

    else:
        print('DEBUG: not working', file=sys.stderr)

    return json.dumps([dict(examQuestion) for examQuestion in examQuestions])

@app.route('/submitQuestion', methods=["POST"])
def submitQuestion():
    if request.method == "POST":
        subjectSelected = request.form["subject"]
        qualificationLevelSelected = request.form["qualification"]
        topicSelected = request.form["topic"]
        questionsAnswers = request.form["questionsAnswers"]
        print(questionsAnswers, file=sys.stderr)
        #questionText = request.form["question"]
        #optionA = request.form["optionA"]
        #optionB = request.form["optionB"]
        #optionC = request.form["optionC"]
        #optionD = request.form["optionD"]
        #correctOption = request.form["correctOption"]
        #questionReason = request.form["questionEntryReason"]

        try:
            connection = engine.connect()
            connection.execute("INSERT INTO QuestionsAnswers(topic_id, question_name, option_a, option_b, option_c, option_d, correct_answer, answer_reason) SELECT topic_id,'" + questionText + "', '" + optionA + "', '" + optionB + "', '" + optionC + "', '" + optionD + "', '" + correctOption + "', '" + questionReason + "' FROM Topics INNER JOIN Subjects ON Subjects.subject_id=Topics.topic_id AND Topics.topic_name='" + topicSelected + "' AND Subjects.qualification_level='" + qualificationLevelSelected + "' AND Subjects.subject_name='" + subjectSelected + "'")
            connection.close()

        except Exception as e:
            return str(e)

@app.route('/updateQuestion', methods=["POST"])
def updateQuestion():
    if request.method == "POST":
        subjectSelected = request.form["subject"]
        qualificationLevelSelected = request.form["qualification"]
        topicSelected = request.form["topic"]
        questionText = request.form["question"]
        optionA = request.form["optionA"]
        optionB = request.form["optionB"]
        optionC = request.form["optionC"]
        optionD = request.form["optionD"]
        correctOption = request.form["correctOption"]
        questionReason = request.form["questionEntryReason"]

        try:
            connection = engine.connect()
            connection.execute("INSERT INTO QuestionsAnswers(topic_id, question_name, option_a, option_b, option_c, option_d, correct_answer, answer_reason) SELECT topic_id,'" + questionText + "', '" + optionA + "', '" + optionB + "', '" + optionC + "', '" + optionD + "', '" + correctOption + "', '" + questionReason + " FROM Topics INNER JOIN Subjects ON Subjects.subject_id=Topics.topic_id AND Topics.topic_name='" + topicSelected + " AND Subjects.qualification_level='" + qualificationLevelSelected + + " AND Subjects.subject_name='" + subjectSelected + "'")
            connection.close()

        except Exception as e:
            return str(e)

@app.route('/getTeacherPoints', methods=["GET"])
def getTeacherPoints():
    if request.method == "GET":
        print("Im in", file=sys.stderr)
        try:
            connection = engine.connect()
            teachers = connection.execute("SELECT * FROM Teachers ORDER BY points DESC, name ASC")
            connection.close()

        except Exception as e:
            return str(e)

        print("got stuff", file=sys.stderr)

    return json.dumps([dict(teacher) for teacher in teachers])

@app.route('/getStudentPoints', methods=["GET"])
def getStudentPoints():
    if request.method == "GET":
        try:
            connection = engine.connect()
            students = connection.execute("SELECT * FROM Students ORDER BY points DESC, name ASC")
            connection.close()

        except Exception as e:
            return str(e)

    return json.dumps([dict(student) for student in students])

@app.route('/loadStudentResult', methods=["POST"])
def loadStudentResult():
    if request.method == "POST":
        subjectSelected = request.form["subject"]
        qualificationSelected = request.form["qualification"]
        topicSelected = request.form["topic"]
        userRole = request.form["role"]
        userEmail = request.form["email"]

        try:
            connection = engine.connect()

            print(userRole, file=sys.stderr)

            if userRole == "Teacher" or userRole == "Admin":
                studentResultData = connection.execute("SELECT T1.email_address, T1.name, T1.subject_name, T1.topic_name, T1.quiz_length, T1.quiz_score, T1.percentage, T1.date_taken, T2.no_of_tests FROM(SELECT PercentageQuizResults.email_address, Students.name, Subjects.subject_name, Topics.topic_name, PercentageQuizResults.quiz_length, PercentageQuizResults.quiz_score, PercentageQuizResults.percentage, PercentageQuizResults.date_taken FROM Subjects INNER JOIN Topics ON Subjects.subject_id=Topics.subject_id AND Subjects.qualification_level='" + qualificationSelected + "' AND Subjects.subject_name='" + subjectSelected + "' INNER JOIN PercentageQuizResults ON PercentageQuizResults.topic_id=Topics.topic_id AND Topics.topic_name='" + topicSelected + "' INNER JOIN Students ON Students.email_address=PercentageQuizResults.email_address) AS T1 INNER join (SELECT COUNT(*) AS no_of_tests, PercentageQuizResults.email_address from PercentageQuizResults GROUP BY email_address HAVING COUNT(*) > 1) AS T2 ON T1.email_address=T2.email_address ORDER BY T1.name ASC")

            if userRole == "Student":
                studentResultData = connection.execute("SELECT Subjects.qualification_level, Subjects.subject_name, Topics.topic_name, PercentageQuizResults.percentage, PercentageQuizResults.date_taken FROM Subjects INNER JOIN Topics ON Subjects.subject_id=Topics.subject_id INNER JOIN PercentageQuizResults ON PercentageQuizResults.topic_id=Topics.topic_id INNER JOIN Students ON Students.email_address=PercentageQuizResults.email_address WHERE Students.email_address='" + userEmail + "' ORDER BY PercentageQuizResults.date_taken DESC")

            connection.close()

        except Exception as e:
            return str(e)

        return json.dumps([dict(result) for result in studentResultData], default=str)

@app.route('/getStudentQuizResults', methods=["POST"])
def getStudentQuizResults():
    if request.method == "POST":
        userEmail = request.form["email"]

        try:
            connection = engine.connect()
            studentResultData = connection.execute("SELECT Subjects.qualification_level, Subjects.subject_name, Topics.topic_name, PercentageQuizResults.percentage, PercentageQuizResults.date_taken FROM Subjects INNER JOIN Topics ON Subjects.subject_id=Topics.subject_id INNER JOIN PercentageQuizResults ON PercentageQuizResults.topic_id=Topics.topic_id INNER JOIN Students ON Students.email_address=PercentageQuizResults.email_address WHERE Students.email_address='" + userEmail + "' ORDER BY PercentageQuizResults.date_taken ASC")
            connection.close()

        except Exception as e:
            return str(e)

        return json.dumps([dict(result) for result in studentResultData], default=str)

@app.route('/loadStudentLeaderboard', methods=["POST"])
def loadStudentLeaderboard():
    if request.method == "POST":
        subjectSelected = request.form["subject"]
        qualificationSelected = request.form["qualification"]
        topicSelected = request.form["topic"]

        try:
            connection = engine.connect()
            averageResults = connection.execute("SELECT AverageTopicResults.average, Students.name FROM AverageTopicResults INNER JOIN Topics ON Topics.topic_name='" + topicSelected + "' INNER JOIN Subjects ON Subjects.subject_id=Topics.topic_id AND Subjects.qualification_level='" + qualificationSelected + "' AND Subjects.subject_name='" + subjectSelected + "' INNER JOIN Students ON Students.email_address=AverageTopicResults.email_address ORDER BY AverageTopicResults.average DESC'")
            connection.close()

        except Exception as e:
            return str(e)

        return json.dumps([dict(averageResult) for averageResult in averageResults], default=str)

@app.route('/storeQuizResults', methods=["POST"])
def storeQuizResults():
    if request.method == "POST":
        studentEmail = request.form["email"]
        subjectSelected = request.form["subject"]
        qualificationSelected = request.form["qualification"]
        topicSelected = request.form["topic"]
        quizScore = request.form["score"]
        quizLength = request.form["length"]
        dateTaken = request.form["date"]

        try:
            connection = engine.connect()
            storingQuizResults = connection.execute("INSERT INTO QuizResults(quiz_length, quiz_score, date_taken, email_address, topic_id) SELECT '" + quizLength + "', '" + quizScore + "', '" + dateTaken + "', '" + studentEmail + "', Topics.topic_id FROM Subjects INNER JOIN Topics ON Subjects.subject_id=Topics.subject_id AND Subjects.qualification_level='" + qualificationSelected + "' AND Subjects.subject_name='" + subjectSelected + "' AND Topics.topic_name='" + topicSelected + "'")
            connection.close()

        except Exception as e:
            return str(e)

@app.route('/storeQuizPoints', methods=["POST"])
def storeQuizPoints():
    if request.method == "POST":
        studentEmail = request.form["email"]
        quizPoints = request.form["points"] # different to the score

        try:
            connection = engine.connect()
            storingPoints = connection.execute("UPDATE Students SET points=(points + '" + quizPoints + "') WHERE email_address='" + studentEmail + "'")
            connection.close()

        except Exception as e:
            return str(e)

@app.route('/sendEmail', methods=["POST"])
def sendEmail():
    if request.method == "POST":
        emailSenderEmail = request.form["contactUsEmail"]
        emailSenderName = request.form["contactUsName"]
        emailSubject = request.form["contactUsSubject"]
        emailMessage = request.form["contactUsMessage"]

        msg = Message("DCRU: " + emailSubject + " (" + emailSenderName + ")",
                      sender="10dcosta@lambeth-academy.org",
                      recipients=["10dcosta@lambeth-academy.org"])
        msg.body = emailMessage + "\n\n" + emailSenderEmail

        mail.send(msg)

    return redirect(url_for('index'))


@app.route('/login')
def login():
    # Step 1
    params = dict(response_type='code',
                  scope=' '.join(scope),
                  client_id=client_id,
                  prompt='select_account',
                  redirect_uri=redirect_uri)
    url = auth_uri + '?' + urllib.parse.urlencode(params)
    return redirect(url)

@app.route('/logout')
def logout():
    session.pop('email', '')
    return redirect(url_for('login'))


@app.route('/callback')
def callback():
    if 'code' in request.args:
        # Step 2
        code = request.args.get('code')
        data = dict(code=code,
                    client_id=client_id,
                    client_secret=client_secret,
                    redirect_uri=redirect_uri,
                    grant_type='authorization_code')
        r = requests.post(token_uri, data=data)
        # Step 3
        access_token = r.json()['access_token']
        r = requests.get(profile_uri, params={'access_token': access_token})

        # Is the domain lambeth-academy.org?
        # Check if hd exists, so that it doesn't cause PythonAnywhere to crash with KeyError
        # Could also be solved with expection handling

        print(r.json(), file=sys.stderr)

        try:
            # Are you a student?
            connection = engine.connect()
            studentRecord = connection.execute("SELECT * FROM Students WHERE email_address='" + r.json()['email'] + "'")
            connection.close()

            # Are you a teacher?
            connection = engine.connect()
            teacherRecord = connection.execute("SELECT * FROM Teachers WHERE email_address='" + r.json()['email'] + "'")
            connection.close()

            if studentRecord.rowcount == True:
                print('Student: ' + r.json()['email'], file=sys.stderr)
                # Now in session
                session['email'] = r.json()['email']
                session['picture'] = r.json()['picture']
                session['family_name'] = r.json()['family_name']
                session['given_name'] = r.json()['given_name']

                # New element
                session['role'] = "Student"
                return redirect(url_for('index'))

            elif teacherRecord.rowcount == True:
                print('Teacher: ' + r.json()['email'], file=sys.stderr)
                # Now in session
                session['email'] = r.json()['email']
                session['picture'] = r.json()['picture']
                session['family_name'] = r.json()['family_name']
                session['given_name'] = r.json()['given_name']

                session['role'] = "Teacher"
                return redirect(url_for('index'))

            else:
                pass

        except:
            # No results at all
            return redirect(url_for('logout'))
    else:
        return 'ERROR'