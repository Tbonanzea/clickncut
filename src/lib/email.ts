import { Resend } from 'resend';

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY
	? new Resend(process.env.RESEND_API_KEY)
	: null;

interface OrderEmailData {
	orderId: string;
	customerEmail: string;
	customerName?: string;
	totalPrice: number;
	items: {
		filename: string;
		materialName: string;
		materialType: string;
		quantity: number;
		price: number;
	}[];
	extras?: string[];
}

/**
 * Send order confirmation email to customer
 */
export async function sendCustomerConfirmationEmail(data: OrderEmailData) {
	const { orderId, customerEmail, customerName, totalPrice, items, extras } = data;

	const itemsHtml = items
		.map(
			(item) => `
		<tr>
			<td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
				${item.filename}
			</td>
			<td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
				${item.materialName} - ${item.materialType}
			</td>
			<td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
				${item.quantity}
			</td>
			<td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
				$${(item.price * item.quantity).toFixed(2)}
			</td>
		</tr>
	`
		)
		.join('');

	const extrasHtml =
		extras && extras.length > 0
			? `
		<div style="margin-top: 24px;">
			<h3 style="color: #1f2937; margin-bottom: 12px;">Servicios Adicionales</h3>
			<ul style="list-style-type: none; padding: 0;">
				${extras.map((extra) => `<li style="padding: 4px 0;">• ${extra}</li>`).join('')}
			</ul>
		</div>
	`
			: '';

	const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
		</head>
		<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
			<div style="background-color: #f9fafb; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
				<h1 style="color: #059669; margin: 0 0 8px 0; font-size: 24px;">
					✓ Cotización Recibida
				</h1>
				<p style="margin: 0; color: #6b7280;">
					Tu solicitud ha sido enviada exitosamente
				</p>
			</div>

			<div style="margin-bottom: 24px;">
				<p>Hola ${customerName || 'Cliente'},</p>
				<p>
					Hemos recibido tu solicitud de cotización y nuestro equipo está revisando tu proyecto.
					Te enviaremos una cotización detallada en las próximas 24-48 horas.
				</p>
			</div>

			<div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
				<div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
					<span style="color: #6b7280;">Número de Orden:</span>
					<strong style="font-family: monospace;">#${orderId.slice(0, 8).toUpperCase()}</strong>
				</div>
				<div style="display: flex; justify-content: space-between;">
					<span style="color: #6b7280;">Total Estimado:</span>
					<strong style="color: #059669;">$${totalPrice.toFixed(2)}</strong>
				</div>
			</div>

			<div style="margin-bottom: 24px;">
				<h2 style="color: #1f2937; font-size: 18px; margin-bottom: 12px;">
					Detalles del Pedido
				</h2>
				<table style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 8px; overflow: hidden;">
					<thead>
						<tr style="background-color: #f9fafb;">
							<th style="padding: 12px; text-align: left; font-weight: 600; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Archivo</th>
							<th style="padding: 12px; text-align: left; font-weight: 600; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Material</th>
							<th style="padding: 12px; text-align: center; font-weight: 600; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Cantidad</th>
							<th style="padding: 12px; text-align: right; font-weight: 600; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Subtotal</th>
						</tr>
					</thead>
					<tbody>
						${itemsHtml}
					</tbody>
				</table>
			</div>

			${extrasHtml}

			<div style="background-color: #eff6ff; padding: 16px; border-radius: 8px; margin-top: 24px;">
				<h3 style="color: #1e40af; margin-top: 0;">Próximos Pasos</h3>
				<ol style="margin: 0; padding-left: 20px; color: #1f2937;">
					<li>Recibirás una cotización detallada en 24-48 horas</li>
					<li>Podrás aprobar la cotización y proceder con el pago</li>
					<li>Iniciaremos la producción una vez confirmado el pago</li>
					<li>Te mantendremos informado sobre el estado de tu orden</li>
				</ol>
			</div>

			<div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
				<p>¿Tienes preguntas? Contáctanos respondiendo a este email.</p>
				<p style="margin-top: 8px;">
					<strong>ClicknCut</strong> - Corte de Precisión a Medida
				</p>
			</div>
		</body>
		</html>
	`;

	// Skip email if Resend is not configured
	if (!resend) {
		console.warn('Resend not configured, skipping customer email');
		return null;
	}

	try {
		const { data, error } = await resend.emails.send({
			from: 'ClicknCut <orders@clickncut.com>', // TODO: Update with actual domain
			to: [customerEmail],
			subject: `Cotización Recibida - Orden #${orderId.slice(0, 8).toUpperCase()}`,
			html,
		});

		if (error) {
			console.error('Error sending customer email:', error);
			throw new Error('Failed to send customer email');
		}

		return data;
	} catch (error) {
		console.error('Error sending customer email:', error);
		throw error;
	}
}

/**
 * Send new order notification to admin
 */
interface PaymentEmailData {
	orderId: string;
	customerEmail: string;
	customerName?: string;
	totalPrice: number;
	paymentMethod: string;
	items: {
		filename: string;
		materialName: string;
		materialType: string;
		quantity: number;
		price: number;
	}[];
}

/**
 * Send payment confirmation email to customer
 */
export async function sendPaymentConfirmationEmail(data: PaymentEmailData) {
	const { orderId, customerEmail, customerName, totalPrice, paymentMethod, items } = data;

	const itemsHtml = items
		.map(
			(item) => `
		<tr>
			<td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
				${item.filename}
			</td>
			<td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
				${item.materialName} - ${item.materialType}
			</td>
			<td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
				${item.quantity}
			</td>
			<td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
				$${(item.price * item.quantity).toFixed(2)}
			</td>
		</tr>
	`
		)
		.join('');

	const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
		</head>
		<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
			<div style="background-color: #d1fae5; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
				<h1 style="color: #065f46; margin: 0 0 8px 0; font-size: 24px;">
					Pago Confirmado
				</h1>
				<p style="margin: 0; color: #047857;">
					Tu pago ha sido procesado exitosamente
				</p>
			</div>

			<div style="margin-bottom: 24px;">
				<p>Hola ${customerName || 'Cliente'},</p>
				<p>
					Hemos recibido tu pago y tu orden esta siendo procesada.
					Te notificaremos cuando tu pedido este listo para envio.
				</p>
			</div>

			<div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
				<div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
					<span style="color: #6b7280;">Numero de Orden:</span>
					<strong style="font-family: monospace;">#${orderId.slice(0, 8).toUpperCase()}</strong>
				</div>
				<div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
					<span style="color: #6b7280;">Metodo de Pago:</span>
					<strong>${paymentMethod}</strong>
				</div>
				<div style="display: flex; justify-content: space-between;">
					<span style="color: #6b7280;">Total Pagado:</span>
					<strong style="color: #059669;">$${totalPrice.toFixed(2)}</strong>
				</div>
			</div>

			<div style="margin-bottom: 24px;">
				<h2 style="color: #1f2937; font-size: 18px; margin-bottom: 12px;">
					Detalles del Pedido
				</h2>
				<table style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 8px; overflow: hidden;">
					<thead>
						<tr style="background-color: #f9fafb;">
							<th style="padding: 12px; text-align: left; font-weight: 600; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Archivo</th>
							<th style="padding: 12px; text-align: left; font-weight: 600; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Material</th>
							<th style="padding: 12px; text-align: center; font-weight: 600; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Cantidad</th>
							<th style="padding: 12px; text-align: right; font-weight: 600; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Subtotal</th>
						</tr>
					</thead>
					<tbody>
						${itemsHtml}
					</tbody>
				</table>
			</div>

			<div style="background-color: #eff6ff; padding: 16px; border-radius: 8px; margin-top: 24px;">
				<h3 style="color: #1e40af; margin-top: 0;">Proximos Pasos</h3>
				<ol style="margin: 0; padding-left: 20px; color: #1f2937;">
					<li>Nuestro equipo comenzara a preparar tu pedido</li>
					<li>Recibiras un email cuando tu pedido este listo para envio</li>
					<li>Podras seguir el estado de tu orden en tu dashboard</li>
				</ol>
			</div>

			<div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
				<p>Tienes preguntas? Contactanos respondiendo a este email.</p>
				<p style="margin-top: 8px;">
					<strong>ClicknCut</strong> - Corte de Precision a Medida
				</p>
			</div>
		</body>
		</html>
	`;

	// Skip email if Resend is not configured
	if (!resend) {
		console.warn('Resend not configured, skipping payment confirmation email');
		return null;
	}

	try {
		const { data, error } = await resend.emails.send({
			from: 'ClicknCut <orders@clickncut.com>',
			to: [customerEmail],
			subject: `Pago Confirmado - Orden #${orderId.slice(0, 8).toUpperCase()}`,
			html,
		});

		if (error) {
			console.error('Error sending payment confirmation email:', error);
			throw new Error('Failed to send payment confirmation email');
		}

		return data;
	} catch (error) {
		console.error('Error sending payment confirmation email:', error);
		throw error;
	}
}

export async function sendAdminNotificationEmail(data: OrderEmailData) {
	const { orderId, customerEmail, customerName, totalPrice, items, extras } = data;

	const itemsHtml = items
		.map(
			(item) => `
		<tr>
			<td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
				${item.filename}
			</td>
			<td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
				${item.materialName} - ${item.materialType}
			</td>
			<td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
				${item.quantity}
			</td>
			<td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
				$${(item.price * item.quantity).toFixed(2)}
			</td>
		</tr>
	`
		)
		.join('');

	const extrasHtml =
		extras && extras.length > 0
			? `
		<div style="margin-top: 24px;">
			<h3 style="color: #1f2937; margin-bottom: 12px;">Servicios Adicionales Solicitados</h3>
			<ul style="list-style-type: none; padding: 0;">
				${extras.map((extra) => `<li style="padding: 4px 0;">• ${extra}</li>`).join('')}
			</ul>
		</div>
	`
			: '';

	const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
		</head>
		<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
			<div style="background-color: #fef3c7; padding: 24px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #f59e0b;">
				<h1 style="color: #92400e; margin: 0 0 8px 0; font-size: 24px;">
					🔔 Nueva Cotización Recibida
				</h1>
				<p style="margin: 0; color: #78350f;">
					Un nuevo cliente ha solicitado una cotización
				</p>
			</div>

			<div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
				<h3 style="margin-top: 0; color: #1f2937;">Información del Cliente</h3>
				<div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
					<span style="color: #6b7280;">Nombre:</span>
					<strong>${customerName || 'No proporcionado'}</strong>
				</div>
				<div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
					<span style="color: #6b7280;">Email:</span>
					<strong>${customerEmail}</strong>
				</div>
				<div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
					<span style="color: #6b7280;">Número de Orden:</span>
					<strong style="font-family: monospace;">#${orderId.slice(0, 8).toUpperCase()}</strong>
				</div>
				<div style="display: flex; justify-content: space-between;">
					<span style="color: #6b7280;">Total Estimado:</span>
					<strong style="color: #059669; font-size: 18px;">$${totalPrice.toFixed(2)}</strong>
				</div>
			</div>

			<div style="margin-bottom: 24px;">
				<h2 style="color: #1f2937; font-size: 18px; margin-bottom: 12px;">
					Items Solicitados
				</h2>
				<table style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 8px; overflow: hidden;">
					<thead>
						<tr style="background-color: #f9fafb;">
							<th style="padding: 12px; text-align: left; font-weight: 600; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Archivo</th>
							<th style="padding: 12px; text-align: left; font-weight: 600; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Material</th>
							<th style="padding: 12px; text-align: center; font-weight: 600; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Cantidad</th>
							<th style="padding: 12px; text-align: right; font-weight: 600; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Subtotal</th>
						</tr>
					</thead>
					<tbody>
						${itemsHtml}
					</tbody>
				</table>
			</div>

			${extrasHtml}

			<div style="background-color: #dbeafe; padding: 16px; border-radius: 8px; margin-top: 24px;">
				<h3 style="color: #1e40af; margin-top: 0;">Acciones Requeridas</h3>
				<ol style="margin: 0; padding-left: 20px; color: #1f2937;">
					<li>Revisar los archivos DXF adjuntos</li>
					<li>Verificar disponibilidad de materiales</li>
					<li>Preparar cotización detallada</li>
					<li>Enviar cotización al cliente en 24-48 horas</li>
				</ol>
			</div>

			<div style="margin-top: 24px; text-align: center;">
				<a href="${process.env.NEXT_PUBLIC_SITE_URL}/orders/${orderId}"
				   style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
					Ver Orden en Dashboard
				</a>
			</div>

			<div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
				<p>Este es un email automático del sistema ClicknCut</p>
			</div>
		</body>
		</html>
	`;

	const adminEmail = process.env.ADMIN_EMAIL || 'admin@clickncut.com'; // TODO: Update with actual admin email

	// Skip email if Resend is not configured
	if (!resend) {
		console.warn('Resend not configured, skipping admin email');
		return null;
	}

	try {
		const { data, error } = await resend.emails.send({
			from: 'ClicknCut System <system@clickncut.com>', // TODO: Update with actual domain
			to: [adminEmail],
			subject: `Nueva Cotización - Orden #${orderId.slice(0, 8).toUpperCase()} - $${totalPrice.toFixed(2)}`,
			html,
		});

		if (error) {
			console.error('Error sending admin email:', error);
			throw new Error('Failed to send admin email');
		}

		return data;
	} catch (error) {
		console.error('Error sending admin email:', error);
		throw error;
	}
}
