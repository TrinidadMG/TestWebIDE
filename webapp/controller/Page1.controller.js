sap.ui.define([
		"sap/ui/core/mvc/Controller",
		"sap/m/MessageBox",
		"sap/m/MessageToast",
		"./utilities",
		"sap/ui/core/routing/History"
	], function (BaseController, MessageBox, MessageToast, Utilities, History) {
		"use strict";
		return BaseController.extend("com.sap.build.sap.b1ExerciseNice.controller.Page1", {
			handleRouteMatched: function (oEvent) {
				var oParams = {};
				if (oEvent.mParameters.data.context) {
					this.sContext = oEvent.mParameters.data.context;
					var oPath;
					if (this.sContext) {
						oPath = {
							path: "/" + this.sContext,
							parameters: oParams
						};
						this.getView().bindObject(oPath);
					}
				}
			},
			_onTableItemPress: function (oEvent) {
				var oBindingContext = oEvent.getParameter("listItem").getBindingContext();
				return new Promise(function (fnResolve) {
					this.doNavigate("Page2", oBindingContext, fnResolve, "");
				}.bind(this)).catch(function (err) {
					if (err !== undefined) {
						MessageBox.error(err.message);
					}
				});
			},
			doNavigate: function (sRouteName, oBindingContext, fnPromiseResolve, sViaRelation) {
				var sPath = oBindingContext ? oBindingContext.getPath() : null;
				var oModel = oBindingContext ? oBindingContext.getModel() : null;
				var sEntityNameSet;
				if (sPath !== null && sPath !== "") {
					if (sPath.substring(0, 1) === "/") {
						sPath = sPath.substring(1);
					}
					sEntityNameSet = sPath.split("(")[0];
				}
				var sNavigationPropertyName;
				var sMasterContext = this.sMasterContext ? this.sMasterContext : sPath;
				if (sEntityNameSet !== null) {
					sNavigationPropertyName = sViaRelation || this.getOwnerComponent().getNavigationPropertyForNavigationWithContext(sEntityNameSet,
						sRouteName);
				}
				if (sNavigationPropertyName !== null && sNavigationPropertyName !== undefined) {
					if (sNavigationPropertyName === "") {
						this.oRouter.navTo(sRouteName, {
							context: sPath,
							masterContext: sMasterContext
						}, false);
					} else {
						oModel.createBindingContext(sNavigationPropertyName, oBindingContext, null, function (bindingContext) {
							if (bindingContext) {
								sPath = bindingContext.getPath();
								if (sPath.substring(0, 1) === "/") {
									sPath = sPath.substring(1);
								}
							} else {
								sPath = "undefined";
							}
							// If the navigation is a 1-n, sPath would be "undefined" as this is not supported in Build
							if (sPath === "undefined") {
								this.oRouter.navTo(sRouteName);
							} else {
								this.oRouter.navTo(sRouteName, {
									context: sPath,
									masterContext: sMasterContext
								}, false);
							}
						}.bind(this));
					}
				} else {
					this.oRouter.navTo(sRouteName);
				}
				if (typeof fnPromiseResolve === "function") {
					fnPromiseResolve();
				}
			},
			_onRowPress: function (oEvent) {
				var oBindingContext = oEvent.getSource().getBindingContext();
				return new Promise(function (fnResolve) {
					this.doNavigate("Page2", oBindingContext, fnResolve, "");
				}.bind(this)).catch(function (err) {
					if (err !== undefined) {
						MessageBox.error(err.message);
					}
				});
			},
			onInit: function () {
				this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				this.oRouter.getTarget("Page1").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
			},
			fileUploadChange: function (oControlEvent) {
				// init the src file, name & url
				this.srcFileURL = null;
				this.srcFileName = null;
				this.srcFile = null;
				// keep a reference of the uploaded file name and create a url out of that when this is an image
				this.srcFile = oControlEvent.getParameters().files[0];
				this.srcFileName = this.srcFile.name;
				if (this.srcFile.type.match("image.*")) {
					this.srcFileURL = URL.createObjectURL(this.srcFile);
				}
			},
			fileUploadComplete: function (oControlEvent) {
				// get the current view
				var oView = this.getView();
				// smbmkt backend
				// clear previous results from the model
				oView.getModel("demo").setProperty("/result", null);
				var processResult = function (oController, data) {
					// merge with existing results -  working with B1 only on this case
					var result = oController.getView().getModel("demo").getProperty("/result");
					if (result) {
						result.push.apply(result, data.b1);
					} else {
						result = data.b1;
					}
					oController.getView().getModel("demo").setProperty("/result", result);
					oController.getView().getModel("demo").setProperty("/fileURL", oController.srcFileURL);
					// Set Model for Table (data not loaded without binding)
					var oTable = oView.byId("tableImgClass");
					var slColItems = oView.byId("colImgClass");
					oTable.setModel(oController.getView().getModel("demo"));
					oTable.bindItems("/result", slColItems);
				};
				if (oControlEvent.getParameters().status === 200) {
					// get the response as JSON and process the results
					processResult(this, JSON.parse(oControlEvent.getParameters().responseRaw));
				} else {
					MessageToast.show("Error " + oControlEvent.getParameters().status + " : " + JSON.parse(oControlEvent.getParameters().responseRaw).error_description);
				}
			},
			/**
			 *@memberOf com.sap.build.sap.b1ExerciseNice.controller.Page1
			 */
			CreateSalesOrder: function (oEvent) {
				// Get Data from ODataModel V4 /Orders 
				var body = {
					"b1": {
						"lines": [{
							"productid": oEvent.getSource().getBindingContext().getObject().productid,
							"Quantity": 1
						}]
					}
				};

				$.ajax({
					url: "https://smbmkt-retiring-sesquipedality.cfapps.eu10.hana.ondemand.com/SalesOrders",
					type: "POST",
					data: JSON.stringify(body),
					contentType: "application/json",
					success: function (data) {
						MessageToast.show("B1 SalesOrder number " + data.b1[0].OrderNum + " created.");
					},
					error: function (jqXHR, textStatus, errorThrown) {
						MessageToast.show("POST SalesOrders error: " + JSON.stringify(jqXHR.responseJSON));
					}
				});
			}
		});
	}, /* bExport= */
	true);