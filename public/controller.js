import Model from "./model.js";                                   //Importing Model class object
import View from "./view.js";                                     //Importing View class object

/**************** CLASS CONTROLLER  ******************/
/** class Controller it connects model and view to handle fired events . 
*/

class Controller {
  //private variables declartion
  _updatedAvailableSeats;
  _trainBookedDetails;
  _myInterval;
  constructor(model, view) {
    this.model = model;                                           //Model class object
    this.view = view;                                             //View calss object
    this.view.showWelcome();
    this.view.AutoCompleteForFromANDTo();                         //Method for autoComplete feature 
    this.view.setDatefieldInBookingSection();                     //Setting calender element min and value fields to current date
    this.view.bindSearchTrainsButton(this.handleSearchTrains,this.timerStop);    //To handle click operation on search trains button 
    this.view.bindpnrsearch(this.handlepnrsearch);                //To handle click operation on pnr search button 
    this.view.bindpnrCancelsearch(this.handlepnrsearchCancel);    //To handle click operation on pnr cancel button
    this.view.bindConfirmCancel(this.getCancelPassengerData);     //To handle click operation on confirm cancel button
  }

/**
 * To stop fetching of trains data from database
 */
 timerStop=()=>{
    clearInterval(this._myInterval);
  }
  
  /**
 * Handler method after clicking on search trains button
 * @param {string} source
 * @param {string} destination
 * @param {string} date 
  */
  handleSearchTrains = async (source, destination, date) => {
    clearInterval(this._myInterval);                               //To stop setInterval means fetching of train data from Database
    
    //calling getTrainDetails in model class for getting train details depending on the user selection
    [this._trainsFoundlist, this.status] = await this.model.getTrainsDetails(source, destination, date);

    //To check status whether trains are found or not
    if (this.status === false) {
      swal({
        title: "IRCTC Alert!!!",
        text: "No Trains Found",
      });
      this.view.removeTrainDetailsMovements();
      this.view.showWelcome();
    } else {
      this.view.displayMovements(this._trainsFoundlist);

      //setinterval to fetch avialable seats of trains for every 1 sec 
      this._myInterval = setInterval(async () => {
        [this._trainsFoundlist, this.status] = await this.model.getTrainsDetails(source, destination, date);
        this.view.displayMovements(this._trainsFoundlist);
        this.view.bindAvailableSeatsClick(this.handleAvailableSeatsClick);
        this.view.bindModelWindow1Close();
      }, 1000);
    }

    //Click action call to open modal1 Window
    this.view.bindAvailableSeatsClick(this.handleAvailableSeatsClick);
    this.view.bindModelWindow1Close();
  };

  /**
   * Handler method, after clicking on AvailableSeats button
   * @param {HTMLElement} movementSelected
  */
  handleAvailableSeatsClick = (movementSelected) => {
    this._movementSelected = movementSelected;
    //Check if Click action call done for inside events of modal1 Window
    this.view.bindSelectPassengers(this.handleSelectPassengers);
  };

  /**
   * Handler method for select passengers input
   * @param {array} passDetails
   * To pass selected number of passengers on select passengers click
     */
  handleSelectPassengers = (passDetails) => {
    //console.log("Booked pasenger details:", passDetails);
    this.generateSeatNumber(passDetails, this._movementSelected);
    this.generateUniquePNR(passDetails);

    //To update avaialble seats of trains in JSON file
    this.model.updateJSONWithUpdatedAvailableSeats(
      this._trainBookedDetails,
      this._updatedAvailableSeats
    );
  };

  /**
   * To generate unique Seat Number
   * @param {number} value  it will hold the available seats data
   * @param {htmlElement} movementSelected
   * on click of book ticket button, ticket will be booked and will generate unique PNR number 
   * To display different status based on avaibility like if seats are available then ticket status will be CF or WL
   */
  generateSeatNumber(value, movementSelected) {
    let avlSeats = this.view.getAvailableSeatsNumber(movementSelected, this._trainsFoundlist);
    value.forEach((v) => {
      if (avlSeats.at(0) === "A" && Number(avlSeats.slice(1)) > 0) {
        v.push("CF");
        v.push(`SL${Number(avlSeats.slice(1))}`); //generating random seat number //{Math.floor(Math.random() * (99 - 1 + 1)) + 1}
        this._updatedAvailableSeats = `A${Number(avlSeats.slice(1)) - 1}`;
        avlSeats = this._updatedAvailableSeats;
      } else if (avlSeats.at(0) === "A" && Number(avlSeats.slice(1)) === 0) {
        this._updatedAvailableSeats = "W1";
        v.push("WL");
        v.push(`WL${Number(avlSeats.slice(1)) + 1}`);
        avlSeats = this._updatedAvailableSeats;
      } else {
        this._updatedAvailableSeats = `W${Number(avlSeats.slice(1)) + 1}`;
        v.push("WL");
        v.push(`WL${Number(avlSeats.slice(1)) + 1}`);
        avlSeats = this._updatedAvailableSeats;
      }
    });
  }

  /**
 * To generate unique 10 digit PNR number
 * @param {Array} value
 *which is a comibination of passenger's name first letter, gender first letter, age first digit along with 5 digit random number 
 */
  generateUniquePNR(value) {
    let Pnr = "";
    for (let i = 0; i < 5; i++) {
      Pnr += value[0][i].at(0);
    }
    Pnr += Math.floor(Math.random() * 90000) + 10000;                           //Generating random 5 digit number
    value.push(Pnr.toUpperCase());
    //Store booked ticket details into dataBase
    this._trainBookedDetails = this.view.getTrainBookedDetails(
      this._movementSelected
    );
    //console.log("Booked train details:", this._trainBookedDetails);
    value.push(this._trainBookedDetails);                                        //To push selected train details into value array
    this.view.showBookingCompletedWindowWithPNRNumber(Pnr.toUpperCase());
    this.model.storeDataOfBookedTicketIntoDataBase(value);
  }

  /**
 * Handler method for PNR search button
 * @param {string} pnrnumber
 * by entering unique PNR number user can view their ticket details, if user enters invalid PNR then it will show alert like
 * no record found with entered PNR number
 */
  handlepnrsearch = async (pnrnumber) => {
    [this._pnrnumberlist, this._status] =
      await this.model.getstoreDataOfBookedTicketFromDataBase(pnrnumber);
    //To check whether pnr number is found or not
    if (this._status === false) {
      swal({
        title: "IRCTC Alert!!!",
        text: "PNR Number not found",
      });
      this.view._pnrnumber.value = "";
    } else {
      this.view.bindModelWindowpnr(this._pnrnumberlist);
    }
    this.view.bindModelPNRWindowClose();
  };

  /**
 * Handler method for PNR search cancellation button
 * @param {string} pnrnumber
 * this will allow user to cancel ticket
 */
  handlepnrsearchCancel = async (pnrnumber) => {
    [this._pnrnumberlist, this._status] =
      await this.model.getstoreDataOfBookedTicketFromDataBase(pnrnumber);
    //To check whether pnr number is found or not
    if (this._status === false) {
      swal({
        title: "IRCTC Alert!!!",
        text: "PNR Number not found",
      });
      this.view._pnrCancelnumber.value = "";
    } else {
      this.view.bindModelWindowpnrCancel(this._pnrnumberlist);
    }
    this.view.bindModelPNRCancelWindowClose();
  };
  //To send cancelled passenger data to MYSQL database
  getCancelPassengerData = ((
    pnrnumberCancel,
    CancelBerth,
    CancelName,
    CancelSeatNo,
    CancelStatus
  ) => {
    this.model.storeDataOfCancelledTicketIntoDataBase(pnrnumberCancel,
      CancelBerth,
      CancelName,
      CancelSeatNo,
      CancelStatus)
  });
}

const app = new Controller(Model, View);                                //Creating a app object by passing Model and View class objects as parameters